/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Tile } from '@app/classes/tile/tile';
import { expect } from 'chai';

describe('Tile', () => {
    const tile = new Tile('Z');

    it('setPoints should set appropriate points to tiles', () => {
        tile.setPoints('*');
        expect(tile.points).to.equal(0);
        tile.setPoints('a');
        expect(tile.points).to.equal(1);
        tile.setPoints('d');
        expect(tile.points).to.equal(2);
        tile.setPoints('b');
        expect(tile.points).to.equal(3);
        tile.setPoints('f');
        expect(tile.points).to.equal(4);
        tile.setPoints('k');
        expect(tile.points).to.equal(5);
        tile.setPoints('j');
        expect(tile.points).to.equal(8);
        tile.setPoints('q');
        expect(tile.points).to.equal(10);
    });
});
