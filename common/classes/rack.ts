import { Tile } from '@app/classes/tile/tile';
import { Constants } from '@common/constants';

export class Rack {
    rack: Tile[];
    tilesToDiscard: Tile[];
    starsToDiscard: number;
    constructor() {
        this.rack = [];
        this.tilesToDiscard = [];
        for (let i = 0; i < Constants.RACK_LENGTH; i++) {
            this.rack[i] = new Tile('-');
        }
    }

    exchangeLetters(newTiles: Tile[]) {
        let letters = '';
        for (const tile of this.tilesToDiscard) {
            letters += tile.letter;
        }
        for (let i = 0; i < this.starsToDiscard; i++) {
            letters += '*';
        }
        let j = 0;
        for (let i = 0; i < Constants.RACK_LENGTH; i++) {
            const tile = this.rack[i];
            if (letters.indexOf(tile.letter) >= 0) {
                this.rack[i] = newTiles[j];
                letters = letters.replace(tile.letter, '');
                j++;
            }
            if (j === newTiles.length) break;
        }
    }

    playerHasLetters(letters: string): boolean {
        this.starsToDiscard = 0;
        let rackLetters = '';
        for (const tile of this.rack) {
            rackLetters += tile.letter.toLowerCase();
        }
        for (const letter of letters) {
            if (letter === letter.toUpperCase() && rackLetters.includes('*')) {
                rackLetters = rackLetters.replace('*', '');
                this.starsToDiscard++;
            } else if (rackLetters.includes(letter)) {
                rackLetters = rackLetters.replace(letter, '');
            } else return false;
        }
        return true;
    }

    isEmpty(): boolean {
        for (const tile of this.rack) {
            if (tile.letter !== '-') {
                return false;
            }
        }
        return true;
    }

    getRackLetters(): string {
        let letters = '';
        for (const tile of this.rack) {
            if (tile.letter !== '-') {
                letters += tile.letter;
            }
        }
        return letters;
    }

    clone(): Tile[] {
        const retRack = [] as Tile[];
        this.rack.forEach((tile) => {
            retRack.push(new Tile(tile.letter));
        });
        return retRack;
    }
}
