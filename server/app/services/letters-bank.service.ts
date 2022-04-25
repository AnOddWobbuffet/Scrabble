import { Tile } from '@app/classes/tile/tile';
import { Constants } from '@common/constants';
import { Service } from 'typedi';

@Service()
export class LettersService {
    remainingLetters: number;
    lettersBank: Tile[];
    winner: string;
    lettersToDiscard: Tile[];
    blueCoords: number[][];
    redCoords: number[][];
    pinkCoords: number[][];
    lightBlueCoords: number[][];
    starCoords: number[][];

    constructor() {
        this.remainingLetters = Constants.LETTERS.TOTAL_LETTERS;
        this.lettersBank = [];
        this.lettersToDiscard = [];
        this.initializeLetterBank();
        this.initializeBonusTiles();
    }

    initializeBonusTiles() {
        this.blueCoords = Constants.BOARD.BLUE_TILES;
        this.redCoords = Constants.BOARD.RED_TILES;
        this.pinkCoords = Constants.BOARD.PINK_TILES;
        this.lightBlueCoords = Constants.BOARD.LIGHT_BLUE_TILES;
        this.starCoords = [Constants.BOARD.STAR_TILE];
    }

    initializeLetterBank() {
        for (let i = 0; i < Constants.LETTERS.LETTER_NUMBERS.length; i++) {
            for (let j = 0; j < Constants.LETTERS.LETTER_NUMBERS[i]; j++) {
                this.lettersBank.push(new Tile(Constants.LETTERS.LETTER_LIST[i]));
            }
        }
    }

    removeLetter(letter: string) {
        for (let i = 0; i < this.lettersBank.length; i++) {
            const l = this.lettersBank[i];
            if (this.remainingLetters > 0 && l.letter === letter) {
                this.remainingLetters--;
                this.lettersBank.splice(i, 1);
                break;
            }
        }
    }

    distributeLetters(missingLetters: number): Tile[] {
        const lettersReturned: Tile[] = [];
        for (let i = 0; i < missingLetters; i++) {
            if (this.remainingLetters > 0) {
                const index = Math.floor(Math.random() * this.remainingLetters);
                const selectedLetter: Tile = this.lettersBank[index];
                lettersReturned.push(selectedLetter);
                this.removeLetter(selectedLetter.letter);
            } else lettersReturned.push(new Tile('-'));
        }
        return lettersReturned;
    }

    addLetterToBank(letter: Tile) {
        this.lettersBank.push(letter);
        this.remainingLetters++;
    }

    exchangeLetters(lettersToDiscard: Tile[]): Tile[] {
        const newLetters: Tile[] = this.distributeLetters(lettersToDiscard.length);
        for (const letter of lettersToDiscard) {
            this.addLetterToBank(letter);
        }
        return newLetters;
    }

    calculateWordPoints(x: number, y: number, isHorizontal: boolean, word: string, usedAllTiles: boolean, playWord: boolean = false): number {
        let multiplier = 1;
        let totalPoints = 0;
        let letters = '';
        for (const letter of word) {
            if (letter !== letter.toUpperCase()) letters += letter;
            else letters += '*';
        }
        const coordinates = [];
        for (let i = 0; i < word.length; i++) {
            if (isHorizontal) coordinates.push([y, x + i]);
            else coordinates.push([y + i, x]);
        }
        for (let i = 0; i < coordinates.length; i++) {
            if (this.inBonusTile(this.blueCoords, coordinates[i], playWord)) totalPoints += new Tile(letters[i]).points * 3;
            else if (this.inBonusTile(this.lightBlueCoords, coordinates[i], playWord)) totalPoints += new Tile(letters[i]).points * 2;
            else if (this.inBonusTile(this.redCoords, coordinates[i], playWord)) {
                totalPoints += new Tile(letters[i]).points;
                multiplier *= 3;
            } else if (this.inBonusTile(this.pinkCoords, coordinates[i], playWord) || this.inBonusTile(this.starCoords, coordinates[i], playWord)) {
                totalPoints += new Tile(letters[i]).points;
                multiplier *= 2;
            } else totalPoints += new Tile(letters[i]).points;
        }
        totalPoints = totalPoints * multiplier;
        if (usedAllTiles) totalPoints += Constants.LETTERS.ALL_LETTERS_BONUS;
        return totalPoints;
    }

    inBonusTile(bonusTiles: number[][], coordinates: number[], playWord: boolean = false): boolean {
        for (const coords of bonusTiles) {
            if (coords[0] === coordinates[0] && coords[1] === coordinates[1]) {
                if (playWord) bonusTiles.splice(bonusTiles.indexOf(coords), 1);
                return true;
            }
        }
        return false;
    }

    rackContainsLetters(rack: Tile[]): boolean {
        const rackLetters = [];
        for (const letter of rack) {
            rackLetters.push(letter.letter);
        }
        for (const tile of this.lettersToDiscard) {
            if (!rackLetters.includes(tile.letter)) return false;
        }
        return true;
    }

    getRemainingLetters(): number {
        return this.remainingLetters;
    }

    getRemainingLettersList(): string[] {
        const list: string[] = [];
        for (const letter of Constants.LETTERS.LETTER_LIST) {
            list.push(letter + ' : ' + this.lettersBank.filter((tile) => tile.letter === letter).length);
        }
        return list;
    }
}
