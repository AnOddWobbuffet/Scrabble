import { Tile } from '@app/classes/tile/tile';
import { Rack } from '@common/classes/rack';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('Rack', () => {
    const rack = new Rack();

    it('exchangeLetters should exchange lettersToDiscard with new ones', () => {
        const newTilesTest: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C')];
        const discardTest: Tile[] = [new Tile('E'), new Tile('F'), new Tile('G')];
        const rackTest: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        const expectedTest: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('A'), new Tile('B'), new Tile('C')];
        rack.rack = rackTest;
        rack.tilesToDiscard = discardTest;
        rack.exchangeLetters(newTilesTest);
        for (let i = 0; i < rack.rack.length; i++) {
            expect(rack.rack[i].letter).to.equal(expectedTest[i].letter);
        }
    });

    it('playerHasLetters should appropriate boolean', () => {
        const rackTest: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('*')];
        rack.rack = rackTest;
        let lettersTest = 'acf';
        let bool = rack.playerHasLetters(lettersTest);
        expect(bool).to.equal(true);
        lettersTest = 'acm';
        bool = rack.playerHasLetters(lettersTest);
        expect(bool).to.equal(false);
        lettersTest = 'Aac';
        bool = rack.playerHasLetters(lettersTest);
        expect(bool).to.equal(true);
    });

    it('isEmpty should appropriate boolean', () => {
        const rackTest: Tile[] = [new Tile('-'), new Tile('-'), new Tile('-'), new Tile('D'), new Tile('-'), new Tile('-'), new Tile('-')];
        rack.rack = rackTest;
        let bool = rack.isEmpty();
        expect(bool).to.equal(false);
        const rackTest2: Tile[] = [new Tile('-'), new Tile('-'), new Tile('-'), new Tile('-'), new Tile('-'), new Tile('-'), new Tile('-')];
        rack.rack = rackTest2;
        bool = rack.isEmpty();
        expect(bool).to.equal(true);
    });

    it('getRackLetters should string of letters in rack', () => {
        const rackTest: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        rack.rack = rackTest;
        const expected = 'ABCDEFG';
        const result = rack.getRackLetters();
        expect(result).to.equal(expected);
    });

    it('clone should return a cloned rack', () => {
        const rackTest: Tile[] = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        rack.rack = rackTest;
        const clone = rack.clone();
        for (let i = 0; i < rackTest.length; i++) {
            expect(clone[i].letter).to.equal(rackTest[i].letter);
        }
    });
});
