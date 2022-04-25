import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Constants } from '@common/constants';
import * as io from 'socket.io';
import { DatabaseService } from './database.service';
import { UserListManager } from './user-list-manager.service';

export class CommandsService {
    handleCommands(
        splitMessage: string[],
        room: Room,
        user: Info,
        sio: io.Server,
        userListManager: UserListManager,
        databaseService: DatabaseService,
    ): string {
        if (splitMessage[0] === '!placer') return this.handlePlace(splitMessage, room, user, sio, userListManager);
        if (splitMessage[0] === '!echanger' || splitMessage[0] === '!échanger')
            return this.handleExchange(user, room, splitMessage, false, sio, userListManager.allUserInfo, splitMessage[1]);
        const checkPass = this.handlePass(splitMessage[0], room, sio, user, userListManager, databaseService);
        if (checkPass !== 'Commande invalide') return checkPass;
        if (splitMessage[0] === '!indice') {
            if (splitMessage.length !== 1) return 'Syntaxe invalide, la commande !indice ne doit pas être suivie de texte';
            return this.handleHint(user, room, userListManager, sio);
        }
        if (splitMessage[0] === '!reserve' || splitMessage[0] === '!réserve') {
            if (splitMessage.length !== 1) return 'Syntaxe invalide, la commande !réserve ne doit pas être suivie de texte';
            return this.handleStorage(user, room, sio);
        }
        if (splitMessage[0] === '!aide') {
            if (splitMessage.length !== 1) return 'Syntaxe invalide, la commande !aide ne doit pas être suivie de texte';
            return this.handleHelp(user, sio);
        }
        return 'La commande ' + splitMessage[0] + " n'est pas valide";
    }

    handlePlace(splitMessage: string[], room: Room, user: Info, sio: io.Server, userListManager: UserListManager): string {
        let isHorizontal = true;
        if (splitMessage.length !== 3) {
            return 'Syntaxe incorrect, la syntaxe a suivre est la suivante: !placer <ligne><colonne>(h | v) <lettres>';
        }
        const letter = splitMessage[1].match(/\D+/g) as string[];
        const numbers = splitMessage[1].match(/\d+/g) as string[];
        if ((splitMessage[2].length > 1 && letter.length !== 2) || (splitMessage[2].length === 1 && letter.length > 2)) {
            return 'Arguments invalides';
        }
        if (letter[letter.length - 1] === 'h') isHorizontal = true;
        else if (letter[letter.length - 1] === 'v') isHorizontal = false;
        else if (splitMessage[2].length > 1) return 'Largument orientation doit etre h ou v';
        const y = letter[0].toUpperCase().charCodeAt(0) - Constants.ASCIIA;
        const x = Number.parseInt(numbers[0], 10) - 1;
        const msgValidation = this.validateWord(x, y, splitMessage[2], isHorizontal, room, user, sio);
        if (msgValidation !== '') return msgValidation;
        return room.board.addWord(x, y, isHorizontal, splitMessage[2], room, user, sio, userListManager.allUserInfo);
    }

    verifyFirstTurn(x: number, y: number, isHorizontal: boolean, word: string, room: Room): boolean {
        if (!room.firstTurn) return true;
        if (
            isHorizontal &&
            y === Constants.BOARD.MIDDLE_POINT &&
            x <= Constants.BOARD.MIDDLE_POINT &&
            x + word.length >= Constants.BOARD.MIDDLE_POINT
        ) {
            return true;
        } else if (
            !isHorizontal &&
            x === Constants.BOARD.MIDDLE_POINT &&
            y <= Constants.BOARD.MIDDLE_POINT &&
            y + word.length >= Constants.BOARD.MIDDLE_POINT
        ) {
            return true;
        }
        return false;
    }

    validateWord(x: number, y: number, wordToPlace: string, isHorizontal: boolean, room: Room, user: Info, sio: io.Server): string {
        const verifCoord = room.board.verificationCoord(x, y);
        if (verifCoord !== '') return verifCoord;
        const tempBoard = room.board.clone();
        tempBoard.showWord(x, y, isHorizontal, wordToPlace);
        sio.to(room.name).emit('receiveBoardData', tempBoard.board);
        if (!this.verifyFirstTurn(x, y, isHorizontal, wordToPlace, room)) return 'Vous devez placer une lettre sur la case H8 lors du premier tour';
        const word = room.board.getFullWord(x, y, isHorizontal, wordToPlace);
        if (!room.gameService.isWordValid(word)) return 'Le mot ' + word + ' ne fait pas partie du dictionnaire';
        return '';
    }

    handleExchange(user: Info, room: Room, splitMessage: string[], placeWord: boolean, sio: io.Server, alluserInfo: Info[], letters: string): string {
        if (splitMessage.length !== 2 && !placeWord) return 'Syntaxe invalide: suivre le format !echanger <lettres>';
        const tilesToDiscard: Tile[] = [];
        for (let i = 0; i < letters.length; i++) {
            tilesToDiscard.push(new Tile(letters.charAt(i).toUpperCase()));
        }
        if (room.playerTurnID !== user.id) return "Ce n'est pas votre tour!";
        if (!user.rack.playerHasLetters(letters))
            return "Commande impossible à réaliser: vous ne pouvez pas jouer ou echanger de lettres que vous n'avez pas!";
        user.rack.tilesToDiscard = tilesToDiscard;
        let newTiles: Tile[];
        if (placeWord) newTiles = room.lettersService.distributeLetters(tilesToDiscard.length);
        else if (room.lettersService.getRemainingLetters() >= Constants.RACK_LENGTH) newTiles = room.lettersService.exchangeLetters(tilesToDiscard);
        else return 'Commande impossible à réaliser: la reserve a moins que 7 lettres!';
        user.rack.exchangeLetters(newTiles);
        const otherUserID = room.idList[1 - room.idList.indexOf(user.id)];
        if (user.rack.isEmpty() && room.lettersService.getRemainingLetters() === 0) {
            for (const otherUser of alluserInfo) {
                if (otherUser.id === otherUserID) {
                    const endGameMessage = room.gameService.declareWinner(user, otherUser, true);
                    sio.to(user.id).emit('updatePoints', user.points);
                    sio.to(otherUser.id).emit('updatePoints', otherUser.points);
                    room.gameService.isGameOver = true;
                    sio.to(room.name).emit('gameOver', endGameMessage);
                    this.sendMessage(room.name, `${room.gameService.rackLettersRemaining(user, otherUser)}`, 'System', sio);
                }
            }
        }
        sio.to(user.id).emit('updateRack', user.rack);
        if (user.rack.getRackLetters().length < Constants.RACK_LENGTH) sio.to(otherUserID).emit('opponentLetters', user.rack.getRackLetters().length);
        if (placeWord) return 'valide';
        this.sendMessage(user.id, `${user.name} a échangé les lettres ${letters}`, 'System', sio);
        this.sendMessage(otherUserID, `${user.name} a échangé ${letters.length} lettres`, 'System', sio);
        return '';
    }

    handlePass(command: string, room: Room, sio: io.Server, user: Info, userListManager: UserListManager, databaseService: DatabaseService): string {
        if (command === '!passer') {
            if (room.playerTurnID !== user.id) return "Ce n'est pas votre tour!";
            const otherUserID = room.idList[1 - room.idList.indexOf(user.id)];
            const otherUser = userListManager.findUser(otherUserID);
            if (otherUser) room.gameService.handleEndTurn(room, user, otherUser, true, sio, databaseService, userListManager);
            return '';
        }
        return 'Commande invalide';
    }

    sendMessage(recipient: string, message: string, from: string, sio: io.Server) {
        const msg: Message = {
            title: from,
            body: message,
        };
        sio.to(recipient).emit('roomMessage', msg);
    }

    handleHint(user: Info, room: Room, userListManager: UserListManager, sio: io.Server): string {
        if (room.playerTurnID !== user.id) return "Ce n'est pas votre tour";
        const ai = userListManager.findAIServiceFromRoom(room.name);
        if (ai) {
            ai.aiHelper.setRack(user.rack.rack);
            const hints = ai.aiHelper.getHints();
            for (const hint of hints) {
                this.sendMessage(user.id, hint, 'System', sio);
            }
        }
        return '';
    }

    handleStorage(user: Info, room: Room, sio: io.Server): string {
        const remainingLettersList = room.lettersService.getRemainingLettersList();
        for (const msg of remainingLettersList) {
            this.sendMessage(user.id, msg, 'System', sio);
        }
        return 'Commande réserve effectuée avec succès';
    }

    handleHelp(user: Info, sio: io.Server): string {
        for (const list of Constants.HELP_COMMAND) {
            for (const msg of list) {
                this.sendMessage(user.id, msg, 'System', sio);
            }
        }
        return '';
    }
}
