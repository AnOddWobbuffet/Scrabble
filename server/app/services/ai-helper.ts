import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { Info } from '@common/classes/info';
import { Rack } from '@common/classes/rack';
import { Constants } from '@common/constants';
import * as io from 'socket.io';

export class AIHelper {
    user: Info;
    sio: io.Server;
    room: Room;
    chosenCoords: number[];
    horizontalCoords: number[][];
    verticalCoords: number[][];
    highestPoint: number;
    rackToUse: Rack;
    starLetter: string;

    constructor(user: Info, sio: io.Server, room: Room) {
        this.user = user;
        this.sio = sio;
        this.room = room;
        this.horizontalCoords = [];
        this.verticalCoords = [];
        this.rackToUse = new Rack();
    }

    randomize(actionsList: string[], probabilities: number[]): string {
        const randomProbability = Math.random();
        let sum = 0;
        for (let i = 0; i < actionsList.length - 1; i++) {
            sum += probabilities[i];
            if (randomProbability < sum) {
                return actionsList[i];
            }
        }
        return actionsList[actionsList.length - 1];
    }

    getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    getAllLetterTile() {
        for (let x = 0; x < Constants.BOARD.BOARD_LENGTH; x++) {
            for (let y = 0; y < Constants.BOARD.BOARD_LENGTH; y++) {
                if (this.room.board.board[y][x].letter !== '-') {
                    this.verticalCoords.push([y, x]);
                    this.horizontalCoords.push([y, x]);
                }
            }
        }
        if (this.verticalCoords.length === 0 && this.horizontalCoords.length === 0) {
            this.verticalCoords.push(Constants.BOARD.STAR_TILE);
            this.horizontalCoords.push(Constants.BOARD.STAR_TILE);
        }
    }

    getRandomSquare(isHorizontal: boolean) {
        if (isHorizontal) {
            this.chosenCoords = this.horizontalCoords[this.getRandomNumber(0, this.horizontalCoords.length - 1)];
            this.horizontalCoords.splice(this.horizontalCoords.indexOf(this.chosenCoords), 1);
        } else {
            this.chosenCoords = this.verticalCoords[this.getRandomNumber(0, this.verticalCoords.length - 1)];
            this.verticalCoords.splice(this.verticalCoords.indexOf(this.chosenCoords), 1);
        }
    }

    removeUnecessarySquares(isHorizontal: boolean) {
        const x = this.chosenCoords[1];
        const y = this.chosenCoords[0];
        if (isHorizontal) {
            this.removeSquare(y, x, isHorizontal, true);
            this.removeSquare(y, x, isHorizontal, false);
        } else {
            this.removeSquare(x, y, isHorizontal, true);
            this.removeSquare(x, y, isHorizontal, false);
        }
    }

    removeSquare(coord: number, fixedCoord: number, isHorizontal: boolean, inc: boolean) {
        let inRange = inc ? coord < Constants.BOARD.BOARD_LENGTH - 1 : coord > 0;
        let letterTile = isHorizontal
            ? this.room.board.board[coord][fixedCoord].letter !== '-'
            : this.room.board.board[fixedCoord][coord].letter !== '-';
        while (inRange && letterTile) {
            coord = inc ? ++coord : --coord;
            if (isHorizontal) this.removeFromCoordsList(isHorizontal, [coord, fixedCoord]);
            else this.removeFromCoordsList(isHorizontal, [fixedCoord, coord]);
            inRange = inc ? coord < Constants.BOARD.BOARD_LENGTH - 1 : coord > 0;
            letterTile = isHorizontal
                ? this.room.board.board[coord][fixedCoord].letter !== '-'
                : this.room.board.board[fixedCoord][coord].letter !== '-';
        }
    }

    removeFromCoordsList(isHorizontal: boolean, coords: number[]) {
        const list = isHorizontal ? this.horizontalCoords : this.verticalCoords;
        for (let i = 0; i < list.length; i++) {
            const coord = list[i];
            if (coord[0] === coords[0] && coord[1] === coords[1]) {
                list.splice(i, 1);
            }
        }
        if (isHorizontal) this.horizontalCoords = list;
        else this.verticalCoords = list;
    }

    usedAllTiles(word: string): boolean {
        let usedAllTiles;
        if (this.room.board.isBoardEmpty()) {
            usedAllTiles = word.length === Constants.RACK_LENGTH ? true : false;
            return usedAllTiles;
        }
        usedAllTiles = word.length === Constants.RACK_LENGTH + 1 ? true : false;
        return usedAllTiles;
    }

    filterWordByPoints(word: string, isHorizontal: boolean, interval: number[]): boolean {
        const coord = this.getStartingCoords(word, isHorizontal);
        const fullWord = this.room.board.getFullWord(coord[1], coord[0], isHorizontal, word);
        const usedAllTiles = this.usedAllTiles(word);
        const points = this.getPoints(isHorizontal, fullWord, usedAllTiles);
        if (points > interval[0] && points <= interval[1]) return true;
        return false;
    }

    getRandomRackTiles(length: number): Tile[] {
        const letters = this.user.rack.getRackLetters();
        const lettersIndex: number[] = [];
        while (length !== 0) {
            const index = this.getRandomNumber(0, letters.length - 1);
            if (!lettersIndex.includes(index)) {
                lettersIndex.push(index);
                length--;
            }
        }
        const tiles: Tile[] = [];
        for (const index of lettersIndex) {
            tiles.push(this.user.rack.rack[index]);
        }
        return tiles;
    }

    verifyDuplicateLetters(letters: string[], word: string): boolean {
        for (const letterOfWord of word) {
            if (!letters.includes(letterOfWord)) return false;
            letters.splice(letters.indexOf(letterOfWord), 1);
        }
        return true;
    }

    validateWord(word: string, coord: number[], isHorizontal: boolean): boolean {
        if (coord.length === 0) return false;
        const invalidWithBoard = this.room.board.verificationBoard(coord[1], coord[0], isHorizontal, word, this.room, this.sio, this.user) !== '';
        const invalidFullWord = !this.room.gameService.isWordValid(this.room.board.getFullWord(coord[1], coord[0], isHorizontal, word));
        if (invalidWithBoard || invalidFullWord) return false;
        return true;
    }

    formatHint(word: string, startingX: number, startingY: number, isHorizontal: boolean): string {
        if (this.starLetter) {
            for (const letter of word) {
                if (letter.toUpperCase() === this.starLetter) {
                    word = word.substring(0, word.indexOf(letter)) + this.starLetter + word.substring(word.indexOf(letter) + 1);
                    break;
                }
            }
        }
        startingY += 1;
        const rowChar = String.fromCharCode(startingX + Constants.ASCIIA).toLowerCase();
        if (isHorizontal) return '!placer ' + rowChar + startingY + 'h ' + word;
        return '!placer ' + rowChar + startingY + 'v ' + word;
    }

    getStartingCoords(word: string, isHorizontal: boolean): number[] {
        const letter = this.room.board.board[this.chosenCoords[0]][this.chosenCoords[1]].letter;
        for (const letters of word) {
            if (letter.toUpperCase() === letters.toUpperCase()) {
                const index = word.indexOf(letters);
                const coords = isHorizontal
                    ? [this.chosenCoords[0], this.chosenCoords[1] - index]
                    : [this.chosenCoords[0] - index, this.chosenCoords[1]];
                if (coords[0] < 0 || coords[0] >= Constants.BOARD.BOARD_LENGTH || coords[1] < 0 || coords[1] >= Constants.BOARD.BOARD_LENGTH)
                    return [];
                return coords;
            }
        }
        return Constants.BOARD.STAR_TILE;
    }

    getPoints(isHorizontal: boolean, word: string, usedAllTiles: boolean): number {
        const x = this.getStartingCoords(word, isHorizontal)[0];
        const y = this.getStartingCoords(word, isHorizontal)[1];
        return this.room.lettersService.calculateWordPoints(x, y, isHorizontal, word, usedAllTiles);
    }

    getValidWord(isHorizontal: boolean, isHint: boolean = true): string[] {
        this.starLetter = '';
        const letter = this.room.board.board[this.chosenCoords[0]][this.chosenCoords[1]].letter;
        let allLetters: string = letter === '-' ? this.rackToUse.getRackLetters() : this.rackToUse.getRackLetters() + letter;
        for (const l of allLetters) {
            if (l === '*') this.starLetter = String.fromCharCode(Constants.ASCIIA + this.getRandomNumber(0, Constants.ALPHABET_LETTERS));
        }
        allLetters = allLetters.toLowerCase();
        const match = [];
        const regexString = '\\b[' + allLetters + ']+\\b';
        const regex = new RegExp(regexString, 'g');
        const maxPoints = parseInt(this.randomize(Constants.LETTERS.POINTS, Constants.LETTERS.POINTS_PROBABILITIES), 10);
        const interval = [maxPoints - Constants.AI.POINTS_INTERVAL, maxPoints];
        this.highestPoint = 0;
        for (const word of this.room.gameService.wordBank) {
            const coords = this.getStartingCoords(word, isHorizontal);
            if (word.match(regex) && this.validateWord(word, coords, isHorizontal) && this.verifyDuplicateLetters([...allLetters], word)) {
                if (this.room.isExpert && !isHint) {
                    if (this.wordHighestPoint(word, isHorizontal)) match[0] = this.formatHint(word, coords[0], coords[1], isHorizontal);
                } else {
                    if (!isHint && !this.filterWordByPoints(word, isHorizontal, interval)) continue;
                    match.push(this.formatHint(word, coords[0], coords[1], isHorizontal));
                    if (match.length === 3) return match;
                }
            }
        }
        return match;
    }

    setRack(rack: Tile[]) {
        for (let i = 0; i < rack.length; i++) {
            this.rackToUse.rack[i] = rack[i];
        }
    }

    getRandomWord(): string {
        const playableWords = new Set();
        this.getAllLetterTile();
        let isHorizontal = true;
        while (playableWords.size < Constants.AI.PLAYABLE_WORDS && (this.horizontalCoords.length > 0 || this.verticalCoords.length > 0)) {
            const coordsSize = isHorizontal ? this.horizontalCoords.length : this.verticalCoords.length;
            if (coordsSize > 0) {
                this.getRandomSquare(isHorizontal);
                const words = this.getValidWord(isHorizontal, false);
                for (const word of words) {
                    playableWords.add(word);
                }
            }
            isHorizontal = !isHorizontal;
        }
        return Array.from(playableWords)[this.getRandomNumber(0, playableWords.size - 1)] as string;
    }

    getHints(): string[] {
        const hints = [];
        this.getAllLetterTile();
        let isHorizontal = true;
        let maxCount = 0;
        while (hints.length < 3 && (this.horizontalCoords.length > 0 || this.verticalCoords.length > 0) && maxCount < Constants.AI.MAX_WORDS) {
            maxCount++;
            const coordsSize = isHorizontal ? this.horizontalCoords.length : this.verticalCoords.length;
            if (coordsSize > 0) {
                this.getRandomSquare(isHorizontal);
                const words = this.getValidWord(isHorizontal, true);
                for (const word of words) {
                    if (hints.indexOf(word) === Constants.LAST_INDEX) hints.push(word);
                    if (hints.length === 3) return hints;
                }
                this.removeUnecessarySquares(isHorizontal);
                isHorizontal = !isHorizontal;
            }
        }
        hints.push('Seulement ' + hints.length + ' possibilités de disponible :(');
        return hints;
    }

    getBestWord(): string {
        const playableWords = new Map();
        this.getAllLetterTile();
        let isHorizontal = true;
        let maxCount = 0;
        while ((this.horizontalCoords.length > 0 || this.verticalCoords.length > 0) && maxCount < Constants.AI.MAX_WORDS) {
            maxCount++;
            const coordsSize = isHorizontal ? this.horizontalCoords.length : this.verticalCoords.length;
            if (coordsSize > 0) {
                this.getRandomSquare(isHorizontal);
                const formattedHint = this.getValidWord(isHorizontal, false);
                this.removeUnecessarySquares(isHorizontal);
                if (formattedHint.length !== 0) {
                    const word = formattedHint[0].split(' ')[2];
                    const coord = this.getStartingCoords(word, isHorizontal);
                    const fullWord = this.room.board.getFullWord(coord[1], coord[0], isHorizontal, word);
                    const usedAllTiles = this.usedAllTiles(word);
                    playableWords.set(this.getPoints(isHorizontal, fullWord, usedAllTiles), formattedHint);
                }
            }
            isHorizontal = !isHorizontal;
        }
        const maxPoints = Math.max(...playableWords.keys());
        return String(playableWords.get(maxPoints));
    }

    wordHighestPoint(word: string, isHorizontal: boolean): boolean {
        const coord = this.getStartingCoords(word, isHorizontal);
        const fullWord = this.room.board.getFullWord(coord[1], coord[0], isHorizontal, word);
        const usedAllTiles = this.usedAllTiles(word);
        const points = this.getPoints(isHorizontal, fullWord, usedAllTiles);
        if (points > this.highestPoint) {
            this.highestPoint = points;
            return true;
        }
        return false;
    }
}
