/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import { Rack } from '@common/classes/rack';
import { expect } from 'chai';
import * as http from 'http';
import * as sinon from 'sinon';
import { SinonFakeTimers, useFakeTimers } from 'sinon';
import * as io from 'socket.io';
import { AIService } from './ai.service';
import { DatabaseService } from './database.service';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';
import { UserListManager } from './user-list-manager.service';

describe('AI Service', () => {
    let aiService: AIService;
    let room: Room;
    let ai: Info;
    let sio: io.Server;
    let user1: Info;
    let userListManager: UserListManager;
    let clock: SinonFakeTimers;
    let database: DatabaseService;

    beforeEach(async () => {
        const server = new http.Server();
        sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        clock = useFakeTimers();
        database = new DatabaseService();
        room = {
            name: 'testName',
            board: new Board(),
            firstTurn: true,
            idList: ['ai', 'player'],
            gameService: new GameService(['aa']),
            lettersService: new LettersService(),
            playerTurnID: 'ai',
            time: NaN,
            isSolo: true,
            timer: null,
            isExpert: false,
            match: new Match(),
            mode: '',
            objectiveManager: new ObjectiveManager(),
        };
        user1 = {
            id: 'player',
            name: 'playerName',
            room: 'testRoom',
            rack: new Rack(),
            points: 20,
            time: NaN,
            mode: '',
        };
        ai = {
            id: 'ai',
            name: 'aiName',
            room: 'testRoom',
            rack: new Rack(),
            points: 20,
            time: NaN,
            mode: '',
        };
        userListManager = new UserListManager();
        aiService = new AIService(ai, sio, room, userListManager, database);
        userListManager.aiList.push(aiService);
        userListManager.allUserInfo.push(user1);
        userListManager.roomList.push(room);
    });

    afterEach(async () => {
        sinon.restore();
        clock.restore();
    });

    it('exchangeRandomLetters should exchange letters', () => {
        aiService.user.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        let initialLetters = '';
        let newLetters = '';
        for (const tile of ai.rack.rack) {
            initialLetters += tile.letter;
        }
        aiService.exchangeRandomLetters();
        for (const tile of aiService.user.rack.rack) {
            newLetters += tile.letter;
        }
        expect(newLetters).not.to.equal(initialLetters);
    });

    it('passTurn should end the AIs turn', () => {
        room.playerTurnID = ai.id;
        aiService.passTurn();
        expect(room.playerTurnID).to.equal(user1.id);
    });

    it('exchangeRandomLetters should exchange the AIs tiles', () => {
        ai.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('B'), new Tile('C')];
        const initialRack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('B'), new Tile('C')];
        aiService.exchangeRandomLetters();
        let isDifferent = false;
        for (let i = 0; i < initialRack.length; i++) {
            if (initialRack[i].letter !== ai.rack.rack[i].letter) {
                isDifferent = true;
            }
        }
        expect(isDifferent).to.equal(true);
    });

    it('exchangeRandomLetters should call passTurn when the bank has less than 7 letters', () => {
        const spy = sinon.spy(aiService, 'passTurn');
        ai.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('B'), new Tile('C')];
        room.lettersService.remainingLetters = 5;
        aiService.exchangeRandomLetters();
        clock.tick(17000);
        sinon.assert.called(spy);
    });

    it('aiActions should call passTurn when action = PassTurn', () => {
        const stub = sinon.stub(aiService.aiHelper, 'randomize').returns('PassTurn');
        const spy = sinon.spy(aiService, 'passTurn');
        aiService.aiActions();
        clock.tick(20000);
        sinon.assert.called(spy);
        stub.restore();
    });

    it('aiActions should call exchangeRandomLetters when action = ExchangeLetters', () => {
        const stub = sinon.stub(aiService.aiHelper, 'randomize').returns('ExchangeLetters');
        const spy = sinon.spy(aiService, 'exchangeRandomLetters');
        aiService.aiActions();
        clock.tick(3000);
        sinon.assert.called(spy);
        stub.restore();
    });

    it('aiActions should call placeWord when action = Play', () => {
        const stub = sinon.stub(aiService.aiHelper, 'randomize').returns('Play');
        const stubWord = sinon.stub(aiService.aiHelper, 'getRandomWord').returns('!placer i8v abces');
        const spy = sinon.spy(aiService, 'placeWord');
        aiService.aiActions();
        sinon.assert.called(spy);
        stub.restore();
        stubWord.restore();
    });

    it('placeWord should call setRack and playWorrd', () => {
        const spyRack = sinon.spy(aiService.aiHelper, 'setRack');
        const spyPlay = sinon.spy(aiService, 'playWord');
        aiService.placeWord();
        clock.tick(3000);
        sinon.assert.called(spyRack);
        sinon.assert.called(spyPlay);
    });

    it('placeWord should call passTurn after 20s when no word found', () => {
        const spy = sinon.spy(aiService, 'passTurn');
        aiService.placeWord();
        clock.tick(20000);
        sinon.assert.called(spy);
    });

    it('placeWord should call getRackLetters, exchangeLetters when no word found and isExpert', () => {
        const stub = sinon.stub(aiService, 'playWord').returns('');
        const spyRack = sinon.spy(ai.rack, 'getRackLetters');
        const spyLetters = sinon.spy(aiService, 'exchangeLetters');
        aiService.room.isExpert = true;
        aiService.placeWord();
        clock.tick(3000);
        sinon.assert.called(spyRack);
        sinon.assert.called(spyLetters);
        stub.restore();
    });

    it('playWord should call getBestWord, addWord, handleEndTurn and isExpert', () => {
        aiService.room.isExpert = true;
        const stub = sinon.stub(aiService.aiHelper, 'getBestWord').returns('!placer h8h act');
        const spyAdd = sinon.spy(room.board, 'addWord');
        const spyEnd = sinon.spy(aiService, 'handleTurnEnd');
        const result = aiService.playWord();
        sinon.assert.called(spyAdd);
        sinon.assert.called(spyEnd);
        expect(result).to.equal('success');
        stub.restore();
    });

    it('playWord should call getBestWord, addWord, handleEndTurn and isExpert', () => {
        aiService.room.isExpert = false;
        const stub = sinon.stub(aiService.aiHelper, 'getBestWord').returns('undefined');
        const result = aiService.playWord();
        expect(result).to.equal('');
        stub.restore();
    });

    it('passTurn should end the game when enough consecutive turns have been passed', () => {
        aiService.room.gameService.consecutiveTurnsPassed = 5;
        aiService.passTurn();
    });

    it('exchangeLetters should call exchangeLetters from lettersService, exchangeLetters from rack, sendMessage and handleTurnEnd', () => {
        aiService.aiHelper.rackToUse.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('R'), new Tile('A'), new Tile('B'), new Tile('C')];
        const spyLettersService = sinon.spy(room.lettersService, 'exchangeLetters');
        const spyRack = sinon.spy(ai.rack, 'exchangeLetters');
        const spySend = sinon.spy(aiService, 'sendMessage');
        const spyTurn = sinon.spy(aiService, 'handleTurnEnd');
        aiService.exchangeLetters(aiService.aiHelper.rackToUse.rack);
        sinon.assert.called(spyLettersService);
        sinon.assert.called(spyRack);
        sinon.assert.called(spySend);
        sinon.assert.called(spyTurn);
    });

    it('exchangeLetters should call passTurn or push tiles when remainingLetters < 7', () => {
        aiService.aiHelper.rackToUse.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('R'), new Tile('A'), new Tile('B'), new Tile('C')];
        sinon.stub(room.lettersService, 'getRemainingLetters').returns(5);
        aiService.exchangeLetters(aiService.aiHelper.rackToUse.rack);
        sinon.restore();
        const spy = sinon.spy(aiService, 'passTurn');
        sinon.stub(room.lettersService, 'getRemainingLetters').returns(0);
        aiService.exchangeLetters(aiService.aiHelper.rackToUse.rack);
        sinon.assert.called(spy);
    });

    it('handleTurnEnd should end the game when enough consecutive turns have been passed', () => {
        aiService.room.gameService.consecutiveTurnsPassed = 5;
        aiService.passTurn();
        expect(room.gameService.isGameOver).to.equal(true);
    });
});
