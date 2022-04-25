/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { CommandsService } from '@app/services/commands.service';
import { GameService } from '@app/services/game-service';
import { LettersService } from '@app/services/letters-bank.service';
import { ObjectiveManager } from '@app/services/objective-manager';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import { Rack } from '@common/classes/rack';
import { expect } from 'chai';
import * as http from 'http';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import * as io from 'socket.io';

describe('Board', () => {
    let commandService: CommandsService;
    let board: Board;
    let room: Room;
    let user1: Info;
    let user2: Info;
    let alluserInfo: Info[];
    let sio: io.Server;

    beforeEach(async () => {
        board = new Board();
        const server = new http.Server();
        commandService = board.commandService;
        sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        room = {
            name: 'testName',
            board,
            firstTurn: true,
            time: 60,
            idList: ['id1', 'id2', 'id3'],
            gameService: new GameService(['aa']),
            lettersService: new LettersService(),
            playerTurnID: 'test',
            isSolo: false,
            timer: null,
            isExpert: false,
            match: new Match(),
            mode: '',
            objectiveManager: new ObjectiveManager(),
        };
        user1 = {
            id: 'test',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 20,
            mode: '',
        };
        user2 = {
            id: 'test2',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 20,
            mode: '',
        };
        alluserInfo = [user1, user2];
    });

    it('getFullWord should return the full word with prefix', () => {
        board.board[0][0] = new Tile('T');
        const fullWord = board.getFullWord(1, 0, true, 'est');
        expect(fullWord).to.equal('Test');
    });

    it('getFullWord should return the full word with suffix', () => {
        board.board[7][7] = new Tile('T');
        const fullWord = board.getFullWord(4, 7, true, 'tes');
        expect(fullWord).to.equal('tesT');
    });

    it('getFullWord should return the full word with isHorizontal false', () => {
        board.board[0][0] = new Tile('T');
        const fullWord = board.getFullWord(0, 1, false, 'est');
        expect(fullWord).to.equal('Test');
    });

    it('verificationCoord should return appropriate error message', () => {
        const expectedCol = 'Largument colonne nest pas valide(1-15 sont les valeurs valides)';
        const expectedLine = 'Largument ligne nest pas valide(a-o sont les valeurs valides)';
        let verif = board.verificationCoord(-1, 0);
        expect(verif).to.equal(expectedCol);
        verif = board.verificationCoord(16, 0);
        expect(verif).to.equal(expectedCol);
        verif = board.verificationCoord(0, -1);
        expect(verif).to.equal(expectedLine);
        verif = board.verificationCoord(0, 16);
        expect(verif).to.equal(expectedLine);
    });

    it('verificationBoard should call verificationWord and getFullWord', () => {
        board.board[0][0] = new Tile('t');
        const spyVerif = sinon.spy(board, 'verificationWord');
        const spyFull = sinon.spy(board, 'getFullWord');
        board.verificationBoard(0, 0, true, 'Testing', room, sio, user1);
        sinon.assert.called(spyVerif);
        sinon.assert.called(spyFull);
    });

    it('verificationBoard should return appropriate error messages', () => {
        board.board[0][0] = new Tile('T');
        room.firstTurn = false;
        const errLength = 'Le mot ne peut pas sortir du board';
        const errBoard = 'Erreur: Le mot nest pas valide avec le board actuel';
        const errTouch = 'Le mot doit toucher a une lettre du plateau (Premier tour omis)';
        let result = board.verificationBoard(0, 0, true, 'TestingAVeryLongWord', room, sio, user1);
        expect(result).to.equal(errLength);
        result = board.verificationBoard(0, 0, true, 'hey', room, sio, user1);
        expect(result).to.equal(errBoard);
        result = board.verificationBoard(5, 5, true, 'Testing', room, sio, user1);
        expect(result).to.equal(errTouch);
    });

    it('verificationBoard should return empty string if no error found', () => {
        board.board[7][7] = new Tile('T');
        const result = board.verificationBoard(7, 4, false, 'tes', room, sio, user1);
        expect(result).to.equal('');
    });

    it('verificationWord should return appropriate boolean', () => {
        room.firstTurn = false;
        let bool = board.verificationWord(0, 0, 'h', true, room, sio, user1, false);
        expect(bool).to.equal(false);
        board.board[1][0] = new Tile('a');
        bool = board.verificationWord(0, 0, 'a', true, room, sio, user1, false);
        expect(bool).to.equal(true);
        board.board[1][0] = new Tile('t');
        bool = board.verificationWord(0, 0, 'h', true, room, sio, user1, false);
        expect(bool).to.equal(false);
        board.board[0][1] = new Tile('a');
        bool = board.verificationWord(0, 0, 'a', false, room, sio, user1, false);
        expect(bool).to.equal(true);
        board.board[0][1] = new Tile('t');
        bool = board.verificationWord(0, 0, 'h', false, room, sio, user1, false);
        expect(bool).to.equal(false);
    });

    it('clone should return a cloned board', () => {
        board.board[0][0] = new Tile('T');
        const clone = board.clone();
        expect(clone.board[0][0].letter).to.equal(board.board[0][0].letter);
    });

    it('showWord should add word to the board', () => {
        const word = 'test';
        board.showWord(0, 0, true, word);
        expect(board.board[0][0].letter).to.equal(word[0]);
        expect(board.board[0][1].letter).to.equal(word[1]);
        expect(board.board[0][2].letter).to.equal(word[2]);
        expect(board.board[0][3].letter).to.equal(word[3]);
    });

    it('showWord should not remove existing Tiles', () => {
        board.board[0][2] = new Tile('f');
        const word = 'test';
        board.showWord(0, 0, true, word);
        expect(board.board[0][0].letter).to.equal(word[0]);
        expect(board.board[0][1].letter).to.equal(word[1]);
        expect(board.board[0][2].letter).to.equal('f');
        expect(board.board[0][3].letter).to.equal(word[3]);
    });

    it('showWord with isHorizontal false', () => {
        board.board[0][2] = new Tile('f');
        const word = 'test';
        board.showWord(0, 0, false, word);
        expect(board.board[0][0].letter).to.equal(word[0]);
        expect(board.board[1][0].letter).to.equal(word[1]);
        expect(board.board[2][0].letter).to.equal(word[2]);
        expect(board.board[3][0].letter).to.equal(word[3]);
    });

    it('addWord should call all needed functions', () => {
        const splitMessage = ['!placer', 'h8h', 'test'];
        const spyVerif = sinon.spy(board, 'verificationBoard');
        const spyExchange = sinon.spy(commandService, 'handleExchange');
        const spyPoints = sinon.spy(room.lettersService, 'calculateWordPoints');
        const spyShow = sinon.spy(board, 'showWord');
        const spyInit = sinon.spy(room.objectiveManager, 'checkObjectivesOnPlace');
        room.mode = 'LOG2990';
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        board.addWord(7, 7, true, splitMessage[2], room, user1, sio, alluserInfo);
        sinon.assert.called(spyVerif);
        sinon.assert.called(spyExchange);
        sinon.assert.called(spyPoints);
        sinon.assert.called(spyShow);
        sinon.assert.called(spyInit);
    });

    it('addWord should normalize letters', () => {
        const splitMessage = ['!placer', 'h8h', 'çêëéàqq'];
        user1.rack.rack = [new Tile('C'), new Tile('E'), new Tile('E'), new Tile('E'), new Tile('A'), new Tile('Q'), new Tile('Q')];
        const message = board.addWord(7, 7, true, splitMessage[2], room, user1, sio, alluserInfo);
        const expectedMessage = 'Le mot ceeeaqq a été placé a la case H8';
        expect(message).to.equal(expectedMessage);
    });

    it('addWord should return verifBoard', () => {
        const splitMessage = ['!placer', 'h8h', 'çêëéà'];
        user1.rack.rack = [new Tile('C'), new Tile('E'), new Tile('E'), new Tile('E'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = board.addWord(16, 7, true, splitMessage[2], room, user1, sio, alluserInfo);
        const expectedMessage = 'Le mot ne peut pas sortir du board';
        expect(message).to.equal(expectedMessage);
    });

    it('isBoardEmpty should return appropriate boolean', () => {
        let result = board.isBoardEmpty();
        expect(result).to.equal(true);
        board.board[0][2] = new Tile('f');
        result = board.isBoardEmpty();
        expect(result).to.equal(false);
    });

    it('addOtherWordPoints should call getStartingCoordsFullWord and calculateWordPoints', () => {
        board.board[0][2] = new Tile('t');
        board.wordCount = 2;
        const spyCoord = sinon.spy(board, 'getStartingCoordsFullWord');
        const spyPoints = sinon.spy(room.lettersService, 'calculateWordPoints');
        board.addOtherWordPoints(7, 7, 'test', true, room);
        sinon.assert.called(spyCoord);
        sinon.assert.called(spyPoints);
    });

    it('getStartingCoordsFullWord should return appropriate coord', () => {
        board.board[7][6] = new Tile('t');
        let coord = board.getStartingCoordsFullWord(7, 7, true);
        let expected = [6, 7];
        expect(coord[0]).to.equal(expected[0]);
        expect(coord[1]).to.equal(expected[1]);
        board.board[2][4] = new Tile('t');
        board.board[3][4] = new Tile('e');
        coord = board.getStartingCoordsFullWord(4, 4, false);
        expected = [4, 2];
        expect(coord[0]).to.equal(expected[0]);
        expect(coord[1]).to.equal(expected[1]);
    });
});
