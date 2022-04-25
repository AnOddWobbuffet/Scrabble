import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { CommandsService } from '@app/services/commands.service';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Constants } from '@common/constants';
import * as io from 'socket.io';

export class Board {
    board: Tile[][];
    commandService: CommandsService;
    letters: string;
    wordCount: number;
    extraPoints: number;
    constructor() {
        this.board = [];
        this.commandService = new CommandsService();
        this.wordCount = 1;
        this.extraPoints = 0;
        for (let i = 0; i < Constants.BOARD.BOARD_LENGTH; i++) {
            this.board[i] = [];
            for (let j = 0; j < Constants.BOARD.BOARD_LENGTH; j++) {
                this.board[i][j] = new Tile('-');
            }
        }
    }
    getFullWord(x: number, y: number, isHorizontal: boolean, addedWord: string): string {
        let prefix = '';
        let suffix = '';
        const startX = x;
        const starty = y;
        if (isHorizontal) x--;
        else y--;
        while (y >= 0 && x >= 0 && this.board[y][x].letter !== '-') {
            prefix = this.board[y][x].letter + prefix;
            if (isHorizontal) x--;
            else y--;
        }
        if (isHorizontal) x = startX + addedWord.length;
        else y = starty + addedWord.length;
        while (y < Constants.BOARD.BOARD_LENGTH && x < Constants.BOARD.BOARD_LENGTH && this.board[y][x].letter !== '-') {
            suffix += this.board[y][x].letter;
            if (isHorizontal) x++;
            else y++;
        }
        return prefix + addedWord + suffix;
    }
    addWord(
        startingX: number,
        startingY: number,
        isHorizontal: boolean,
        word: string,
        room: Room,
        user: Info,
        sio: io.Server,
        infos: Info[],
        isAI: boolean = false,
    ): string {
        this.wordCount = 1;
        this.extraPoints = 0;
        word = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const verifBoard = this.verificationBoard(startingX, startingY, isHorizontal, word, room, sio, user);
        if (verifBoard !== '') return verifBoard;
        const usedAllTiles = this.letters.length === Constants.RACK_LENGTH ? true : false;
        const msgValidation = this.commandService.handleExchange(user, room, [], true, sio, infos, this.letters);
        if (msgValidation !== 'valide') return msgValidation;
        const fullWord = this.getFullWord(startingX, startingY, isHorizontal, word);
        const coord = this.getStartingCoordsFullWord(startingX, startingY, isHorizontal);
        user.points += room.lettersService.calculateWordPoints(coord[0], coord[1], isHorizontal, fullWord, usedAllTiles, true);
        user.points += this.extraPoints;
        const opponentId = room.idList[1 - room.idList.indexOf(user.id)];
        room.gameService.sendMessage(
            opponentId,
            `${user.name} a placé le mot ${word.toLowerCase()} à la case ${String.fromCharCode(startingY + Constants.ASCIIA)}${startingX + 1} `,
            'System',
            sio,
        );
        sio.to(opponentId).emit('updateOpponentPoints', user.points);
        if (!isAI) {
            sio.to(user.id).emit('updatePoints', user.points);
            sio.to(user.id).emit('wordPlayed');
        }
        this.showWord(startingX, startingY, isHorizontal, word);
        room.firstTurn = false;
        if (room.mode === 'LOG2990')
            room.objectiveManager.checkObjectivesOnPlace(startingX, startingY, word, this, sio, user, opponentId, isHorizontal, this.wordCount);
        return isAI ? '' : 'Le mot ' + word + ' a été placé a la case ' + String.fromCharCode(startingY + Constants.ASCIIA) + (startingX + 1);
    }

    verificationCoord(x: number, y: number): string {
        if (x < 0 || x > Constants.BOARD.BOARD_LENGTH - 1) {
            return 'Largument colonne nest pas valide(1-15 sont les valeurs valides)';
        }
        if (y < 0 || y > Constants.BOARD.BOARD_LENGTH - 1) {
            return 'Largument ligne nest pas valide(a-o sont les valeurs valides)';
        }
        return '';
    }

    verificationBoard(startx: number, starty: number, isHorizontal: boolean, word: string, room: Room, sio: io.Server, user: Info): string {
        this.letters = '';
        let touchesLetter = false;
        let x = startx;
        let y = starty;
        const outRangeX = x + word.length > Constants.BOARD.BOARD_LENGTH;
        const outRangeY = y + word.length > Constants.BOARD.BOARD_LENGTH;
        if ((isHorizontal && outRangeX) || (!isHorizontal && outRangeY)) {
            return 'Le mot ne peut pas sortir du board';
        }
        for (const letter of word) {
            if (this.board[y][x].letter !== letter.toLowerCase() && this.board[y][x].letter !== '-') {
                return 'Erreur: Le mot nest pas valide avec le board actuel';
            }
            if (this.board[y][x].letter === '-') this.letters += letter;
            if (isHorizontal) x++;
            else y++;
        }
        if (!this.letters && !room.firstTurn) return 'Vous devez rajouter des lettres au board pour pouvoir jouer';
        if (this.getFullWord(startx, starty, isHorizontal, word).length > word.length) {
            touchesLetter = true;
        }
        if (!this.verificationWord(startx, starty, word, isHorizontal, room, sio, user, touchesLetter)) {
            return 'Le mot doit toucher a une lettre du plateau (Premier tour omis)';
        }
        return '';
    }

    verificationWord(x: number, y: number, word: string, isHorizontal: boolean, room: Room, sio: io.Server, user: Info, touche: boolean): boolean {
        let extraWordsValid = true;
        for (const letter of word) {
            if (isHorizontal) {
                if ((y > 0 && this.board[y - 1][x].letter !== '-') || (y < Constants.BOARD.BOARD_LENGTH - 1 && this.board[y + 1][x].letter !== '-')) {
                    touche = true;
                    const extraWord = this.getFullWord(x, y, false, letter);
                    extraWordsValid = this.verifyExtraWord(x, y, isHorizontal, room, sio, user, extraWord);
                    if (!extraWordsValid) return false;
                }
                x++;
            } else {
                if ((x > 0 && this.board[y][x - 1].letter !== '-') || (x < Constants.BOARD.BOARD_LENGTH - 1 && this.board[y][x + 1].letter !== '-')) {
                    touche = true;
                    const extraWord = this.getFullWord(x, y, true, letter);
                    extraWordsValid = this.verifyExtraWord(x, y, isHorizontal, room, sio, user, extraWord);
                    if (!extraWordsValid) return false;
                }
                y++;
            }
        }
        return (room.firstTurn || touche) && extraWordsValid;
    }

    verifyExtraWord(x: number, y: number, isHorizontal: boolean, room: Room, sio: io.Server, user: Info, extraWord: string): boolean {
        let extraWordsValid = true;
        if (!room.gameService.isWordValid(extraWord)) {
            const msg: Message = {
                title: 'System',
                body: 'Le mot ' + extraWord + ' ne fait pas partie du dictionnaire',
            };
            extraWordsValid = false;
            sio.to(user.id).emit('roomMessage', msg);
        } else if (this.board[y][x].letter === '-') {
            this.wordCount++;
            this.addOtherWordPoints(x, y, extraWord, !isHorizontal, room);
        }
        return extraWordsValid;
    }

    showWord(startingX: number, startingY: number, isHorizontal: boolean, word: string) {
        for (let i = 0; i < word.length; i++) {
            if (isHorizontal) {
                if (this.board[startingY][startingX + i].letter === '-') {
                    this.board[startingY][startingX + i] = new Tile(word[i]);
                    if (word[i] === word[i].toUpperCase()) this.board[startingY][startingX + i].points = 0;
                }
            } else {
                if (this.board[startingY + i][startingX].letter === '-') {
                    this.board[startingY + i][startingX] = new Tile(word[i]);
                    if (word[i] === word[i].toUpperCase()) this.board[startingY + i][startingX].points = 0;
                }
            }
        }
    }

    clone(): Board {
        const clonedBoard = new Board();
        for (let i = 0; i < Constants.BOARD.BOARD_LENGTH; i++) {
            for (let j = 0; j < Constants.BOARD.BOARD_LENGTH; j++) {
                clonedBoard.board[i][j] = new Tile(this.board[i][j].letter);
            }
        }
        return clonedBoard;
    }

    isBoardEmpty(): boolean {
        let empty = true;
        for (let i = 0; i < Constants.BOARD.BOARD_LENGTH; i++) {
            for (let j = 0; j < Constants.BOARD.BOARD_LENGTH; j++) {
                if (this.board[j][i].letter !== '-') {
                    empty = false;
                }
            }
        }
        return empty;
    }

    getStartingCoordsFullWord(x: number, y: number, isHorizontal: boolean): number[] {
        if (isHorizontal) x--;
        else y--;
        while (y >= 0 && x >= 0 && this.board[y][x].letter !== '-') {
            if (isHorizontal) x--;
            else y--;
        }
        return isHorizontal ? [x + 1, y] : [x, y + 1];
    }

    addOtherWordPoints(x: number, y: number, word: string, isHorizontal: boolean, room: Room) {
        const coord = this.getStartingCoordsFullWord(x, y, isHorizontal);
        this.extraPoints += room.lettersService.calculateWordPoints(coord[0], coord[1], isHorizontal, word, false);
    }
}
