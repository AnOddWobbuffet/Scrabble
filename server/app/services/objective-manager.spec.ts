/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import { Rack } from '@common/classes/rack';
import { Constants } from '@common/constants';
import { expect } from 'chai';
import * as http from 'http';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';

describe('Objective Manager', () => {
    let objectiveManager: ObjectiveManager;
    let sio: io.Server;
    let user1: Info;
    let objectivesList: string[];
    let room: Room;
    beforeEach(async () => {
        const server = new http.Server();
        objectiveManager = new ObjectiveManager();
        sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        objectivesList = Array.from(Constants.OBJECTIVES_LIST.keys());
        user1 = {
            id: 'player',
            name: 'playerName',
            room: 'testRoom',
            rack: new Rack(),
            points: 20,
            time: NaN,
            mode: '',
        };
        room = {
            name: 'testName',
            board: new Board(),
            firstTurn: true,
            idList: ['testId', 'player'],
            gameService: new GameService(['aa']),
            lettersService: new LettersService(),
            playerTurnID: 'player',
            time: NaN,
            isSolo: false,
            timer: null,
            isExpert: false,
            match: new Match(),
            mode: '',
            objectiveManager,
        };
        objectiveManager.user = user1;
        objectiveManager.sio = sio;
        objectiveManager.player1Id = user1.id;
        objectiveManager.opponentId = 'testId';
    });

    it('checkObjectivesOnPlace should call all checkMethods', () => {
        const spyBorder = sinon.spy(objectiveManager, 'checkBorder');
        const spyEight = sinon.spy(objectiveManager, 'checkEightLong');
        const spyZ = sinon.spy(objectiveManager, 'checkZ');
        const spyVowel = sinon.spy(objectiveManager, 'checkVowel');
        const spyStar = sinon.spy(objectiveManager, 'checkStarUsedTwice');
        const spyThreeInOne = sinon.spy(objectiveManager, 'checkThreeInOne');
        const spyThreeTimes = sinon.spy(objectiveManager, 'checkThreeTimes');
        objectiveManager.checkObjectivesOnPlace(0, 0, 'test', new Board(), sio, user1, 'testId', true, 1);
        sinon.assert.called(spyBorder);
        sinon.assert.called(spyEight);
        sinon.assert.called(spyZ);
        sinon.assert.called(spyVowel);
        sinon.assert.called(spyStar);
        sinon.assert.called(spyThreeInOne);
        sinon.assert.called(spyThreeTimes);
    });
    it('checkBorder should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[0]);
        objectiveManager.checkBorder(0, 0, 'test', 'objective', true);
        sinon.assert.calledWith(spyCompleted, objectivesList[0], 25, 'objective');
    });
    it('checkZ should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[1]);
        objectiveManager.checkZ('z', 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[1], 10, 'objective');
    });
    it('checkThreeTimes should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[2]);
        objectiveManager.wordsPlaced = ['test', 'test', 'test'];
        objectiveManager.checkThreeTimes('test', 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[2], 20, 'objective');
    });
    it('checkStarUsedTwice should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[4]);
        objectiveManager.checkStarUsedTwice('TEst', 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[4], 15, 'objective');
    });
    it('checkStarUsedTwice should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[4]);
        objectiveManager.player1Id = 'testId';
        objectiveManager.checkStarUsedTwice('TEst', 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[4], 15, 'objective');
    });
    it('checkThreeInOne should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[5]);
        objectiveManager.checkThreeInOne(3, 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[5], 30, 'objective');
    });
    it('checkEightLong should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[6]);
        objectiveManager.checkEightLong('testeight', 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[6], 25, 'objective');
    });
    it('checkVowel should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[7]);
        objectiveManager.checkVowel('oui', 'objective');
        sinon.assert.calledWith(spyCompleted, objectivesList[7], 15, 'objective');
    });
    it('CheckRack should call objectiveCompleted when the objective is available and done', () => {
        const spyCompleted = sinon.spy(objectiveManager, 'objectiveCompleted');
        objectiveManager.publicObjectives.push(objectivesList[3]);
        objectiveManager.privateObjective1 = 'objective';
        objectiveManager.checkRack('abcdelp', user1, room, sio);
        objectiveManager.player1Id = 'testId';
        objectiveManager.checkRack('abcdelp', user1, room, sio);
        sinon.assert.calledWith(spyCompleted, objectivesList[3], 40, 'objective');
    });
    it('objectiveCompleted should call sendMessage twice', () => {
        const spy = sinon.spy(objectiveManager, 'sendMessage');
        const spyEmit = sinon.spy(objectiveManager.sio, 'to');
        objectiveManager.objectiveCompleted('objective', 10, 'objective');
        objectiveManager.player1Id = 'testId';
        objectiveManager.objectiveCompleted('objective', 10, 'objective');
        sinon.assert.callCount(spy, 4);
        sinon.assert.callCount(spyEmit, 12);
    });
    it('randomObjective should reduce list length', () => {
        objectiveManager.getRandomObjective();
        expect(objectiveManager.objectivesList.length).to.equal(7);
    });
    it('initializeObjective should call randomObjective 4 times and set values', () => {
        const spyRandom = sinon.spy(objectiveManager, 'getRandomObjective');
        const spyEmit = sinon.spy(objectiveManager.sio, 'to');
        objectiveManager.initializeObjectives(sio, user1, room);
        sinon.assert.callCount(spyEmit, 6);
        sinon.assert.callCount(spyRandom, 4);
    });
    it('sendMessage should call sio.to', () => {
        const spyEmit = sinon.spy(objectiveManager.sio, 'to');
        objectiveManager.sendMessage('rec', 'message', 'System', sio);
        sinon.assert.calledOnce(spyEmit);
    });
});
