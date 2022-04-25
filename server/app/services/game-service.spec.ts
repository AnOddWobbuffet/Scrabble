/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Tile } from '@app/classes/tile/tile';
import { Info } from '@common/classes/info';
import { Rack } from '@common/classes/rack';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonFakeTimers, useFakeTimers } from 'sinon';
import { GameService } from './game-service';

describe('GameService', () => {
    let gameService: GameService;
    let clock: SinonFakeTimers;
    const TIMER = 60;
    let info1Test: Info;
    let info2Test: Info;

    beforeEach(async () => {
        gameService = new GameService(['aa']);
        clock = useFakeTimers();
        info1Test = {
            id: 'test',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 20,
            mode: '',
        };
        info2Test = {
            id: 'test2',
            name: 'testName2',
            room: 'testRoom2',
            time: 60,
            rack: new Rack(),
            points: 10,
            mode: '',
        };
    });

    afterEach(() => {
        clock.restore();
    });

    it('startTimer should set timeLeft', (done: Mocha.Done) => {
        gameService.roomTime = TIMER;
        gameService.startTimer();
        expect(gameService.timeLeft).to.equal(TIMER);
        clock.tick(1000);
        expect(gameService.timeLeft).to.equal(TIMER - 1);
        clock.tick(10000);
        expect(gameService.timeLeft).to.equal(TIMER - 11);
        clock.tick(49000);
        done();
    });

    it('startTime should call stopTimer', (done: Mocha.Done) => {
        const spy = sinon.spy(gameService, 'stopTimer');
        let timeLeft = TIMER;
        gameService.timer = setInterval(() => {
            timeLeft--;
        }, 1000);
        gameService.startTimer();
        sinon.assert.called(spy);
        expect(timeLeft).to.equal(TIMER);
        done();
    });

    it('stopTimer should call clearInterval', (done: Mocha.Done) => {
        const spyClear = sinon.spy(global, 'clearInterval');
        gameService.roomTime = TIMER;
        gameService.stopTimer();
        sinon.assert.called(spyClear);
        done();
    });

    it('getTimeLeft should return timeLeft', (done: Mocha.Done) => {
        const timeLeft = 50;
        gameService.timeLeft = timeLeft;
        const result = gameService.getTimeLeft();
        expect(result).to.equal(timeLeft);
        done();
    });

    it('togglePlayerTurn should call startTimer', (done: Mocha.Done) => {
        const spyStart = sinon.spy(gameService, 'startTimer');
        gameService.togglePlayerTurn();
        sinon.assert.called(spyStart);
        done();
    });

    it('isWordValid should return appropriate boolean', (done: Mocha.Done) => {
        gameService.wordBank = ['hey', 'hi', 'yo'];
        let wordTest = 'yo';
        const bool = gameService.isWordValid(wordTest);
        expect(bool).to.equal(true);
        wordTest = 'hello';
        const boolFalse = gameService.isWordValid(wordTest);
        expect(boolFalse).to.equal(false);
        done();
    });

    it('declareWinner should declare player 1 as winner', (done: Mocha.Done) => {
        info1Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        info2Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        const empty = false;
        const result = gameService.declareWinner(info1Test, info2Test, empty);
        expect(result).to.equal(info1Test.name);
        expect(info1Test.points).to.equal(13);
        expect(info2Test.points).to.equal(3);
        done();
    });

    it('declareWinner should declare player 2 as winner', (done: Mocha.Done) => {
        info1Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        info2Test.points = 30;
        info2Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        const empty = false;
        const result = gameService.declareWinner(info1Test, info2Test, empty);
        expect(result).to.equal(info2Test.name);
        expect(info1Test.points).to.equal(13);
        expect(info2Test.points).to.equal(23);
        done();
    });

    it('declareWinner should declare both as winner', (done: Mocha.Done) => {
        info1Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        info2Test.points = 20;
        info2Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        const empty = false;
        const result = gameService.declareWinner(info1Test, info2Test, empty);
        const expected = info1Test.name + ' ET ' + info2Test.name + ' ONT GAGNES';
        expect(result).to.equal(expected);
        expect(info1Test.points).to.equal(13);
        expect(info2Test.points).to.equal(13);
        done();
    });

    it('declareWinner should declare player 1 as winner because of special bonus', (done: Mocha.Done) => {
        info1Test.rack.rack = [];
        info2Test.points = 20;
        info2Test.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        const empty = true;
        const result = gameService.declareWinner(info1Test, info2Test, empty);
        expect(result).to.equal(info1Test.name);
        expect(info1Test.points).to.equal(27);
        expect(info2Test.points).to.equal(13);
        done();
    });

    it('rackLettersRemaining should return message with players remaining tiles', (done: Mocha.Done) => {
        info1Test.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        info2Test.points = 30;
        info2Test.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C')];
        const message = gameService.rackLettersRemaining(info1Test, info2Test);
        const expected = ['Fin de partie - lettres restantes', info1Test.name + ' : ABCDEFG', info2Test.name + ' : ABC'];
        for (let i = 0; i < message.length; i++) {
            expect(message[i]).to.equal(expected[i]);
        }
        done();
    });
});
