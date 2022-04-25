import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Constants } from '@common/constants';
import * as io from 'socket.io';
import { AIHelper } from './ai-helper';
import { DatabaseService } from './database.service';
import { UserListManager } from './user-list-manager.service';

export class AIService {
    user: Info;
    sio: io.Server;
    room: Room;
    highestPoint: number;
    aiHelper: AIHelper;

    constructor(user: Info, sio: io.Server, room: Room, public userListManager: UserListManager, public database: DatabaseService) {
        this.user = user;
        this.sio = sio;
        this.room = room;
        this.aiHelper = new AIHelper(user, sio, room);
    }

    aiActions() {
        if (this.room.gameService.isGameOver || this.room.playerTurnID !== this.user.id) return;
        const action = this.aiHelper.randomize(Constants.AI.ACTIONS, Constants.AI.ACTIONS_PROBABILITIES);
        if (action === Constants.AI.ACTIONS[0]) {
            setTimeout(() => this.passTurn(), Constants.AI.END_TURN_DELAY + Constants.AI.PLAY_DELAY);
        } else if (action === Constants.AI.ACTIONS[1]) setTimeout(() => this.exchangeRandomLetters(), Constants.AI.PLAY_DELAY);
        else this.placeWord();
    }

    placeWord() {
        this.aiHelper.setRack(this.user.rack.rack);
        setTimeout(() => {
            const result = this.playWord();
            if (result === 'success') return;
            if (!this.room.isExpert) setTimeout(() => this.passTurn(), Constants.AI.END_TURN_DELAY);
            else {
                if (this.room.playerTurnID === this.user.id) {
                    const aiLetters = this.user.rack.getRackLetters();
                    const tilesToExchange = [];
                    for (const letter of aiLetters) {
                        tilesToExchange.push(new Tile(letter.toUpperCase()));
                    }
                    this.exchangeLetters(tilesToExchange);
                }
            }
        }, Constants.AI.PLAY_DELAY);
    }

    playWord(): string {
        const formattedHint: string = this.room.isExpert ? this.aiHelper.getBestWord() : this.aiHelper.getRandomWord();
        if (formattedHint === 'undefined' || !formattedHint) return '';
        const splitMessage = formattedHint.split(' ');
        const isHorizontal = splitMessage[1].slice(Constants.LAST_INDEX) === 'h' ? true : false;
        const x = splitMessage[1].charAt(0).toUpperCase().charCodeAt(0) - Constants.ASCIIA;
        const y = parseInt(splitMessage[1].slice(1, Constants.LAST_INDEX), 10) - 1;
        const word = splitMessage[2];
        this.room.board.addWord(y, x, isHorizontal, word, this.room, this.user, this.sio, this.userListManager.allUserInfo, true);
        this.sio.to(this.room.name).emit('receiveBoardData', this.room.board.board);
        this.sio.to(this.room.name).emit('updateOpponentPoints', this.user.points);
        this.handleTurnEnd(false);
        return 'success';
    }

    exchangeRandomLetters() {
        const interval = setTimeout(() => this.passTurn(), Constants.AI.END_TURN_DELAY);
        const letters = this.user.rack.getRackLetters();
        const numberOfLetters = this.aiHelper.getRandomNumber(1, letters.length);
        if (this.room.lettersService.getRemainingLetters() < Constants.RACK_LENGTH) return;
        clearInterval(interval);
        this.exchangeLetters(this.aiHelper.getRandomRackTiles(numberOfLetters));
    }

    exchangeLetters(tiles: Tile[]) {
        const remainingLetters = this.room.lettersService.getRemainingLetters();
        let tilesToExchange = [];
        if (remainingLetters < Constants.RACK_LENGTH) {
            if (remainingLetters === 0) {
                this.passTurn();
                return;
            }
            for (let i = 0; i < remainingLetters; i++) {
                tilesToExchange.push(tiles[i]);
            }
        } else tilesToExchange = tiles;
        this.user.rack.tilesToDiscard = tilesToExchange;
        const newTiles = this.room.lettersService.exchangeLetters(tilesToExchange);
        this.user.rack.exchangeLetters(newTiles);
        const playerID = this.room.idList[1 - this.room.idList.indexOf(this.user.id)];
        this.sendMessage(playerID, `${this.user.name} a échangé ${tilesToExchange.length} lettres`, 'System');
        this.handleTurnEnd(false);
    }

    passTurn() {
        if (this.room.playerTurnID !== this.user.id) return;
        this.handleTurnEnd(true);
        const playerID = this.room.idList[1 - this.room.idList.indexOf(this.user.id)];
        this.sendMessage(playerID, `${this.user.name} a passé son tour`, 'System');
    }

    handleTurnEnd(isTurnSkip: boolean) {
        const room = this.userListManager.findInRoomList(this.user.id) as Room;
        if (!room) return;
        const playerID = room.idList[1 - room.idList.indexOf(this.user.id)];
        const player = this.userListManager.findUser(playerID) as Info;
        if (isTurnSkip) {
            room.gameService.consecutiveTurnsPassed++;
            if (room.gameService.consecutiveTurnsPassed === Constants.MAX_TURNS_SKIPPED) {
                room.gameService.isGameOver = true;
                this.sio.to(this.room.name).emit('gameOver', this.room.gameService.declareWinner(this.user, player, false));
                const msgList = room.gameService.rackLettersRemaining(this.user, player);
                for (const msg of msgList) {
                    this.sendMessage(room.name, msg, 'System');
                }
                this.sio.to(playerID).emit('updatePoints', player.points);
                this.sio.to(this.room.name).emit('updateOpponentPoints', this.user.points);
                this.database.addToDatabase(player.name, player.points, room.mode);
                room.match.getEndingMatchInfo(player.points, this.user.points, room.gameService.duration, room.isSolo);
                this.database.insertData('MatchHistory', room.match);
                setTimeout(() => {
                    this.sio.emit('matches', this.database.matchHistory);
                }, Constants.TIME.ADMIN_TIME);
            }
        } else room.gameService.consecutiveTurnsPassed = 0;
        room.playerTurnID = playerID;
        room.gameService.togglePlayerTurn();
        this.sio.to(room.name).emit('currentPlayerTurn', this.userListManager.findUser(room.playerTurnID));
    }

    sendMessage(recipient: string, message: string, from: string) {
        const msg: Message = {
            title: from,
            body: message,
        };
        this.sio.to(recipient).emit('roomMessage', msg);
    }
}
