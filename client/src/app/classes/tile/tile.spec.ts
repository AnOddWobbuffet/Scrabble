/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { Tile } from '@app/classes/tile/tile';

describe('Tile', () => {
    const tile = new Tile('A');

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(Tile).toBeTruthy();
    });

    it('setPoints should set appropriate points to tiles', () => {
        tile.setPoints('*');
        expect(tile.points).toEqual(0);
        tile.setPoints('A');
        expect(tile.points).toEqual(1);
        tile.setPoints('D');
        expect(tile.points).toEqual(2);
        tile.setPoints('B');
        expect(tile.points).toEqual(3);
        tile.setPoints('F');
        expect(tile.points).toEqual(4);
        tile.setPoints('K');
        expect(tile.points).toEqual(5);
        tile.setPoints('J');
        expect(tile.points).toEqual(8);
        tile.setPoints('Q');
        expect(tile.points).toEqual(10);
    });
});
