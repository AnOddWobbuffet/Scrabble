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
import { AIHelper } from './ai-helper';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';
import { UserListManager } from './user-list-manager.service';

describe('AI Helper', () => {
    let aiHelper: AIHelper;
    let room: Room;
    let ai: Info;
    let sio: io.Server;
    let user1: Info;
    let userListManager: UserListManager;
    let clock: SinonFakeTimers;

    beforeEach(async () => {
        const server = new http.Server();
        sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        clock = useFakeTimers();
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
        aiHelper = new AIHelper(ai, sio, room);
        userListManager.allUserInfo.push(user1);
        userListManager.roomList.push(room);
    });

    afterEach(async () => {
        sinon.restore();
        clock.restore();
    });

    it('getAllLetterTile should add all tiles with letters to horizontalCoords and verticalCoords', () => {
        room.board.board[1][1] = new Tile('T');
        room.board.board[2][1] = new Tile('A');
        aiHelper.getAllLetterTile();
        expect(aiHelper.horizontalCoords.length).to.equal(2);
        expect(aiHelper.horizontalCoords[0][0]).to.equal(1);
        expect(aiHelper.verticalCoords[0][1]).to.equal(1);
        expect(aiHelper.horizontalCoords[1][0]).to.equal(2);
        expect(aiHelper.verticalCoords[1][1]).to.equal(1);
    });

    it('getAllLetterTile should add [7,7] to horizontalCoords and verticalCoords when board is empty', () => {
        aiHelper.getAllLetterTile();
        expect(aiHelper.horizontalCoords.length).to.equal(1);
        expect(aiHelper.horizontalCoords[0][0]).to.equal(7);
        expect(aiHelper.verticalCoords[0][1]).to.equal(7);
    });

    it('getRandomSquare should call getRandomNumber', () => {
        room.board.board[1][1] = new Tile('T');
        aiHelper.horizontalCoords = [[1, 1]];
        const spyRandom = sinon.spy(aiHelper, 'getRandomNumber');
        aiHelper.getRandomSquare(true);
        sinon.assert.called(spyRandom);
    });

    it('getRandomSquare should assign [7, 7] to chosenCoords when board is empty and remove that coord from coords', () => {
        aiHelper.getAllLetterTile();
        expect(aiHelper.horizontalCoords.length).to.equal(1);
        aiHelper.getRandomSquare(true);
        const expected = [7, 7];
        expect(aiHelper.chosenCoords[0]).to.equal(expected[0]);
        expect(aiHelper.chosenCoords[1]).to.equal(expected[1]);
        expect(aiHelper.horizontalCoords.length).to.equal(0);
    });

    it('getRandomSquare should assign a tile with letters to chosenCoords', () => {
        room.board.board[1][2] = new Tile('T');
        aiHelper.verticalCoords = [[1, 2]];
        aiHelper.getRandomSquare(false);
        const expected = [1, 2];
        expect(aiHelper.chosenCoords[0]).to.equal(expected[0]);
        expect(aiHelper.chosenCoords[1]).to.equal(expected[1]);
    });

    it('randomize should return a random action', () => {
        const listTest = ['1', '2', '3'];
        const probTest = [0.8, 0.1, 0.1];
        sinon.stub(Math, 'random').returns(0.5);
        let result = aiHelper.randomize(listTest, probTest);
        expect(result).to.equal(listTest[0]);
        sinon.restore();
        sinon.stub(Math, 'random').returns(0.9);
        result = aiHelper.randomize(listTest, probTest);
        expect(result).to.equal(listTest[2]);
    });

    it('getStartingCoords should return appropriate coords', () => {
        room.board.board[1][1] = new Tile('A');
        aiHelper.chosenCoords = [1, 1];
        let result = aiHelper.getStartingCoords('sa', true);
        let expected = [1, 0];
        expect(result[0]).to.equal(expected[0]);
        expect(result[1]).to.equal(expected[1]);
        result = aiHelper.getStartingCoords('sa', false);
        expected = [0, 1];
        expect(result[0]).to.equal(expected[0]);
        expect(result[1]).to.equal(expected[1]);
        result = aiHelper.getStartingCoords('sqwertyuiopdfgha', false);
        expect(result.length).to.equal(0);
    });

    it('getPoints should call getStartingCoords and calculateWordPoints', () => {
        room.board.board[1][1] = new Tile('A');
        aiHelper.chosenCoords = [1, 1];
        const spyCoords = sinon.spy(aiHelper, 'getStartingCoords');
        const spyPoints = sinon.spy(room.lettersService, 'calculateWordPoints');
        aiHelper.getPoints(true, 'test', false);
        sinon.assert.called(spyCoords);
        sinon.assert.called(spyPoints);
    });

    it('getPoints should return points of word depending on usedAllTiles', () => {
        room.board.board[1][2] = new Tile('A');
        aiHelper.chosenCoords = [7, 7];
        let result = aiHelper.getPoints(true, 'aa', false);
        let expected = 4; // tile double word
        expect(result).to.equal(expected);
        aiHelper.chosenCoords = [1, 1];
        result = aiHelper.getPoints(true, 'carotte', true);
        expected = 68; // tile double word + all letters bonus (50)
        expect(result).to.equal(expected);
    });

    it('getHints should give 3 playable words', () => {
        aiHelper.rackToUse.rack = [new Tile('A'), new Tile('A'), new Tile('C'), new Tile('T'), new Tile('O'), new Tile('I')];
        aiHelper.room.gameService.wordBank = ['act', 'ayooooo', 'bruh', 'tact', 'toi'];
        room.board.board[7][7] = new Tile('t');
        const expectedResult = ['!placer h6h act', '!placer h8h tact', '!placer h8h toi'];
        const hints = aiHelper.getHints();
        for (let i = 0; i < hints.length; i++) {
            expect(hints[i]).to.equal(expectedResult[i]);
        }
    });

    it('getHints should give playable words in vertical and show error message when less than 3 hints', () => {
        aiHelper.rackToUse.rack = [new Tile('A'), new Tile('A'), new Tile('C'), new Tile('T'), new Tile('A'), new Tile('I')];
        aiHelper.room.gameService.wordBank = ['ayooooo', 'bruh', 'tact', 'toi'];
        room.board.board[7][7] = new Tile('t');
        const expectedResult = ['!placer h8h tact', '!placer h8v tact', 'Seulement 2 possibilités de disponible :('];
        const hints = aiHelper.getHints();
        for (let i = 0; i < hints.length; i++) {
            expect(hints[i]).to.equal(expectedResult[i]);
        }
    });

    it('setRack should set the rackToUSe', () => {
        const rack = [new Tile('A'), new Tile('A'), new Tile('C'), new Tile('T'), new Tile('O'), new Tile('I'), new Tile('A')];
        aiHelper.setRack(rack);
        for (let i = 0; i < rack.length; i++) {
            expect(aiHelper.rackToUse.rack[i].letter).to.equal(rack[i].letter);
        }
    });

    it('formatHint should format the word', () => {
        let result = aiHelper.formatHint('test', 7, 7, true);
        let expected = '!placer h8h test';
        expect(result).to.equal(expected);
        result = aiHelper.formatHint('test', 7, 7, false);
        expected = '!placer h8v test';
        expect(result).to.equal(expected);
    });

    it('formatHint should format the word with * letter', () => {
        aiHelper.starLetter = 'E';
        const result = aiHelper.formatHint('test', 7, 7, true);
        const expected = '!placer h8h tEst';
        expect(result).to.equal(expected);
    });

    it('getRandomNumber should return a random number between interval', () => {
        sinon.stub(Math, 'random').returns(0.5);
        let result = aiHelper.getRandomNumber(0, 3);
        expect(result).to.equal(2);
        result = aiHelper.getRandomNumber(3, 3);
        expect(result).to.equal(3);
    });

    it('getRandomWord should call randomize, getAllLetterTile, getRandomSquare, getValidWord, filterWordByPoints and getRandomNumber', () => {
        aiHelper.rackToUse.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('R'), new Tile('A'), new Tile('B'), new Tile('C')];
        const spySquare = sinon.spy(aiHelper, 'getRandomSquare');
        const spyLetters = sinon.spy(aiHelper, 'getAllLetterTile');
        const spyNumber = sinon.spy(aiHelper, 'getRandomNumber');
        aiHelper.getRandomWord();
        sinon.assert.called(spyLetters);
        sinon.assert.called(spySquare);
        sinon.assert.called(spyNumber);
    });

    it('getRandomWord should return appropriate boolean', () => {
        sinon.stub(aiHelper, 'getValidWord').returns(['!placer i8v aa', '!placer i8h aa', '!placer i8v le']);
        sinon.stub(aiHelper, 'getRandomNumber').returns(0);
        const result = aiHelper.getRandomWord();
        expect(result).to.equal('!placer i8v aa');
    });

    it('getBestWord should return appropriate boolean', () => {
        aiHelper.room.isExpert = true;
        sinon.stub(aiHelper, 'getValidWord').returns(['!placer h8h zac']);
        const result = aiHelper.getBestWord();
        expect(result).to.equal('!placer h8h zac');
    });

    it('filterWordByPoints should return appropriate boolean', () => {
        sinon.stub(aiHelper, 'getPoints').returns(2);
        sinon.stub(aiHelper, 'getStartingCoords').returns([7, 7]);
        sinon.stub(room.board, 'getFullWord').returns('aa');
        let result = aiHelper.filterWordByPoints('aa', true, [1, 6]);
        expect(result).to.equal(true);
        result = aiHelper.filterWordByPoints('aa', true, [6, 12]);
        expect(result).to.equal(false);
        sinon.restore();
        const spy = sinon.spy(aiHelper, 'getPoints');
        aiHelper.chosenCoords = [7, 7];
        aiHelper.filterWordByPoints('aa', true, [6, 12]);
        sinon.assert.called(spy);
    });

    it('getValidWord should give valid words from dictionary', () => {
        aiHelper.rackToUse.rack = [new Tile('A'), new Tile('A'), new Tile('C'), new Tile('T'), new Tile('O'), new Tile('I')];
        aiHelper.room.gameService.wordBank = ['act', 'aaaact', 'bruh', 'tact', 'toi'];
        aiHelper.chosenCoords = [7, 7];
        room.board.board[7][7] = new Tile('t');
        const expectedResult = ['!placer h6h act', '!placer h8h tact', '!placer h8h toi'];
        const words = aiHelper.getValidWord(true);
        for (let i = 0; i < words.length; i++) {
            expect(words[i]).to.equal(expectedResult[i]);
        }
    });

    it('getValidWord should give valid best words from dictionary when isExpert', () => {
        aiHelper.rackToUse.rack = [new Tile('A'), new Tile('A'), new Tile('C'), new Tile('T'), new Tile('O'), new Tile('Z')];
        aiHelper.room.gameService.wordBank = ['act', 'zact', 'bruh', 'tact', 'toi'];
        aiHelper.chosenCoords = [7, 7];
        aiHelper.room.isExpert = true;
        room.board.board[7][7] = new Tile('t');
        const expectedResult = ['!placer h5h zact'];
        const words = aiHelper.getValidWord(true, false);
        expect(words[0]).to.equal(expectedResult[0]);
    });

    it('validateWord should call verificationBoard, isWordValid and getFullWord', () => {
        const spyBoard = sinon.spy(room.board, 'verificationBoard');
        const spyWord = sinon.spy(room.gameService, 'isWordValid');
        const spyFull = sinon.spy(room.board, 'getFullWord');
        aiHelper.validateWord('test', [7, 7], true);
        sinon.assert.called(spyBoard);
        sinon.assert.called(spyWord);
        sinon.assert.called(spyFull);
    });

    it('validateWord should return false if empty coord or invalid with board', () => {
        let result = aiHelper.validateWord('test', [], true);
        expect(result).to.equal(false);
        sinon.stub(room.board, 'verificationBoard').returns('invalide');
        result = aiHelper.validateWord('test', [7, 7], true);
        expect(result).to.equal(false);
    });

    it('verifyDuplicateLetters should return appropriate boolean', () => {
        const arrTest = ['a', 'b', 'c'];
        let result = aiHelper.verifyDuplicateLetters(arrTest, 'on');
        expect(result).to.equal(false);
        result = aiHelper.verifyDuplicateLetters(arrTest, 'bac');
        expect(result).to.equal(true);
        result = aiHelper.verifyDuplicateLetters(arrTest, 'baca');
        expect(result).to.equal(false);
    });

    it('wordHighestPoint should return appropriate boolean', () => {
        aiHelper.highestPoint = 0;
        aiHelper.chosenCoords = [7, 7];
        let result = aiHelper.wordHighestPoint('eau', true);
        expect(result).to.equal(true);
        expect(aiHelper.highestPoint).to.equal(6);
        result = aiHelper.wordHighestPoint('ai', false);
        expect(result).to.equal(false);
    });

    it('usedAllTiles should call isBoardEmpty and return appropriate boolean', () => {
        const spyBoard = sinon.spy(room.board, 'isBoardEmpty');
        let result = aiHelper.usedAllTiles('test');
        sinon.assert.called(spyBoard);
        expect(result).to.equal(false);
        result = aiHelper.usedAllTiles('testers');
        expect(result).to.equal(true);
        room.board.board[7][7] = new Tile('c');
        result = aiHelper.usedAllTiles('carottes');
        expect(result).to.equal(true);
        result = aiHelper.usedAllTiles('carotte');
        expect(result).to.equal(false);
    });

    it('removeUnecessarySquares should call removeSquare', () => {
        room.board.board[1][1] = new Tile('A');
        aiHelper.chosenCoords = [1, 1];
        const spy = sinon.spy(aiHelper, 'removeSquare');
        aiHelper.removeUnecessarySquares(true);
        aiHelper.removeUnecessarySquares(false);
        sinon.assert.called(spy);
    });

    it('removeSquare should call removeFromCoordsList', () => {
        const spy = sinon.spy(aiHelper, 'removeFromCoordsList');
        room.board.board[1][1] = new Tile('A');
        aiHelper.chosenCoords = [1, 1];
        aiHelper.removeSquare(1, 1, true, true);
        aiHelper.removeSquare(1, 1, false, false);
        sinon.assert.called(spy);
    });

    it('removeFromCoordsList should remove coord from horizontalCoords or verticalCoords', () => {
        aiHelper.horizontalCoords = [[1, 1]];
        aiHelper.verticalCoords = [[1, 2]];
        aiHelper.removeFromCoordsList(true, [1, 1]);
        aiHelper.removeFromCoordsList(false, [1, 2]);
        expect(aiHelper.horizontalCoords.length).to.equal(0);
        expect(aiHelper.verticalCoords.length).to.equal(0);
    });

    it('getBestWord should return the word with highest points', () => {
        aiHelper.rackToUse.rack = [new Tile('A'), new Tile('A'), new Tile('C'), new Tile('T'), new Tile('O'), new Tile('I'), new Tile('Z')];
        aiHelper.room.gameService.wordBank = ['act', 'zact', 'ayooooo', 'bruh'];
        aiHelper.room.isExpert = true;
        room.board.board[7][7] = new Tile('a');
        const expectedResults = ['!placer h7h zact', '!placer g8v zact'];
        const word = aiHelper.getBestWord();
        expect(expectedResults).to.include(word);
    });
});
