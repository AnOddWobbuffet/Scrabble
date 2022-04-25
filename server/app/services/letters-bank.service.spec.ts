/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Tile } from '@app/classes/tile/tile';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { LettersService } from './letters-bank.service';

describe('Letters service', () => {
    let letterService: LettersService;
    const TOTAL_LETTERS = 102;

    beforeEach(async () => {
        letterService = new LettersService();
    });

    it('initializeLetterBank should initialized letter bank with 102 letters', (done: Mocha.Done) => {
        expect(letterService.lettersBank.length).to.equal(TOTAL_LETTERS);
        done();
    });

    it('removeLetter should remove distributed letter', (done: Mocha.Done) => {
        letterService.removeLetter('A');
        expect(letterService.remainingLetters).to.equal(TOTAL_LETTERS - 1);
        done();
    });

    it('distributeLetters should call removeLetter', () => {
        const spy = sinon.spy(letterService, 'removeLetter');
        const missingLetters = 3;
        const lettersReturned = letterService.distributeLetters(missingLetters);
        sinon.assert.calledThrice(spy);
        expect(lettersReturned.length).to.equal(missingLetters);
    });

    it('distributeLetters should push - when remainingLetters = 0', () => {
        const missingLetters = 3;
        letterService.remainingLetters = 0;
        const lettersReturned = letterService.distributeLetters(missingLetters);
        expect(lettersReturned[0].letter).to.equal('-');
    });

    it('addLetterToBank should add a letter to letterBank', () => {
        const letterTest = new Tile('A');
        expect(letterService.lettersBank.length).to.equal(TOTAL_LETTERS);
        letterService.addLetterToBank(letterTest);
        expect(letterService.remainingLetters).to.equal(TOTAL_LETTERS + 1);
        expect(letterService.lettersBank[TOTAL_LETTERS].letter).to.equal('A');
    });

    it('exchangeLetters should call distributeLetters and addLetterToBank', () => {
        const spy = sinon.spy(letterService, 'distributeLetters');
        const spyAdd = sinon.spy(letterService, 'addLetterToBank');
        const lettersToDiscard = [new Tile('A'), new Tile('B'), new Tile('C')];
        const newLetters = letterService.exchangeLetters(lettersToDiscard);
        sinon.assert.called(spy);
        sinon.assert.calledThrice(spyAdd);
        expect(newLetters.length).to.equal(lettersToDiscard.length);
    });

    it('calculateWordPoints should return total points of word', () => {
        const word = 'aa';
        const points = letterService.calculateWordPoints(7, 8, false, word, false);
        expect(points).to.equal(2);
    });

    it('calculateWordPoints should return total points of word', () => {
        const word = 'a*';
        const points = letterService.calculateWordPoints(7, 8, false, word, false);
        expect(points).to.equal(1);
    });

    it('calculateWordPoints should return double points on star tile', () => {
        const word = 'aa';
        const points = letterService.calculateWordPoints(7, 7, false, word, false);
        expect(points).to.equal(4);
    });

    it('calculateWordPoints should add 50 bonus points', () => {
        const word = 'aa';
        const points = letterService.calculateWordPoints(7, 8, false, word, true);
        expect(points).to.equal(52);
    });

    it('calculateWordPoints should call inBonusTile', () => {
        const spy = sinon.spy(letterService, 'inBonusTile');
        const word = 'test';
        letterService.calculateWordPoints(7, 7, true, word, false);
        sinon.assert.called(spy);
    });

    it('calculateWordPoints should return total points depending on bonus', () => {
        const word = 'aa';
        let points = letterService.calculateWordPoints(6, 6, true, word, false);
        expect(points).to.equal(3);
        points = letterService.calculateWordPoints(5, 5, true, word, false);
        expect(points).to.equal(4);
        points = letterService.calculateWordPoints(13, 1, true, word, false);
        expect(points).to.equal(4);
        points = letterService.calculateWordPoints(0, 0, true, word, false);
        expect(points).to.equal(6);
        points = letterService.calculateWordPoints(7, 7, true, word, false);
        expect(points).to.equal(4);
    });

    it('inBonusTile should return appropriate boolean', (done: Mocha.Done) => {
        const bonus: number[][] = [
            [0, 0],
            [1, 1],
            [2, 2],
        ];
        let coord = [1, 2];
        const boolFalse = letterService.inBonusTile(bonus, coord);
        expect(boolFalse).to.equal(false);
        expect(bonus.length).to.equal(3);
        coord = [1, 1];
        const bool = letterService.inBonusTile(bonus, coord, true);
        expect(bool).to.equal(true);
        expect(bonus.length).to.equal(2);
        expect(bonus).not.include(coord);
        done();
    });

    it('rackContainsLetters should return appropriate boolean', (done: Mocha.Done) => {
        const rack: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        letterService.lettersToDiscard = [new Tile('A'), new Tile('B'), new Tile('C')];
        const bool = letterService.rackContainsLetters(rack);
        expect(bool).to.equal(true);
        letterService.lettersToDiscard = [new Tile('A'), new Tile('L'), new Tile('C')];
        const boolFalse = letterService.rackContainsLetters(rack);
        expect(boolFalse).to.equal(false);
        done();
    });

    it('getRemainingLetters should return remainingLetters', (done: Mocha.Done) => {
        let remainingLetters = letterService.getRemainingLetters();
        expect(remainingLetters).to.equal(letterService.remainingLetters);
        letterService.remainingLetters = 80;
        remainingLetters = letterService.getRemainingLetters();
        expect(remainingLetters).to.equal(letterService.remainingLetters);
        done();
    });

    it('getRemainingLettersList should return the list of all letters with its quantity', (done: Mocha.Done) => {
        letterService.lettersBank = [new Tile('A'), new Tile('A'), new Tile('B')];
        const remainingLetters = letterService.getRemainingLettersList();
        const expected = [
            'A : 2',
            'B : 1',
            'C : 0',
            'D : 0',
            'E : 0',
            'F : 0',
            'G : 0',
            'H : 0',
            'I : 0',
            'J : 0',
            'K : 0',
            'L : 0',
            'M : 0',
            'N : 0',
            'O : 0',
            'P : 0',
            'Q : 0',
            'R : 0',
            'S : 0',
            'T : 0',
            'U : 0',
            'V : 0',
            'W : 0',
            'X : 0',
            'Y : 0',
            'Z : 0',
            '* : 0',
        ];
        for (let i = 0; i < remainingLetters.length; i++) {
            expect(remainingLetters[i]).to.equal(expected[i]);
        }
        done();
    });
});
