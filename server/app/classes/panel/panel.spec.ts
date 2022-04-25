/* eslint-disable @typescript-eslint/no-magic-numbers */
import { expect } from 'chai';
import { describe } from 'mocha';
import { Panel } from './panel';

describe('Panel', () => {
    it('should create a panel', () => {
        const paneltest: Panel = new Panel(10, 'test', 3);
        expect(paneltest.time).to.equals(10);
        expect(paneltest.playerTurnName).to.equals('test');
        expect(paneltest.remainingLetters).to.equals(3);
    });
});
