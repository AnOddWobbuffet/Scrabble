import { Panel } from '@app/classes/panel/panel';
import { Room } from '@app/classes/room/room';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Constants } from '@common/constants';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { AIService } from './ai.service';
import { DatabaseService } from './database.service';
import { LettersService } from './letters-bank.service';
import { UserListManager } from './user-list-manager.service';

@Service()
export class GameService {
    timer: NodeJS.Timer;
    roomTime: number;
    timeLeft: number;
    duration: number;
    wordBank: string[];
    consecutiveTurnsPassed: number;
    isGameOver: boolean;
    objectivesList: Map<string, number>;

    constructor(words: string[]) {
        this.duration = 0;
        this.wordBank = words;
        this.consecutiveTurnsPassed = 0;
        this.isGameOver = false;
        this.objectivesList = Constants.OBJECTIVES_LIST;
    }

    startTimer() {
        if (this.timer) this.stopTimer();
        this.timeLeft = this.roomTime;
        this.timer = setInterval(() => {
            this.duration++;
            this.timeLeft--;
        }, Constants.TIME.INTERVAL);
    }

    stopTimer() {
        clearInterval(this.timer);
    }

    getTimeLeft(): number {
        return this.timeLeft;
    }

    togglePlayerTurn() {
        this.startTimer();
    }

    isWordValid(word: string): boolean {
        return this.wordBank.includes(word.toLowerCase());
    }

    declareWinner(user1: Info, user2: Info, rackEmpty: boolean): string {
        let user2RackPoints = 0;
        for (const tile of user1.rack.rack) {
            user1.points -= tile.points;
        }
        for (const tile of user2.rack.rack) {
            user2.points -= tile.points;
            user2RackPoints += tile.points;
        }
        if (rackEmpty) user1.points += user2RackPoints;
        if (user1.points > user2.points) return user1.name;
        else if (user1.points < user2.points) return user2.name;
        else return user1.name + ' ET ' + user2.name + ' ONT GAGNES';
    }

    rackLettersRemaining(user1: Info, user2: Info): string[] {
        const msg: string[] = [];
        msg.push('Fin de partie - lettres restantes');
        let tmp = '';
        tmp += user1.name + ' : ';
        for (const tile of user1.rack.rack) {
            tmp += tile.letter;
        }
        msg.push(tmp);
        tmp = '';
        tmp += user2.name + ' : ';
        for (const tile of user2.rack.rack) {
            tmp += tile.letter;
        }
        msg.push(tmp);
        return msg;
    }

    handleEndTurn(
        room: Room,
        user: Info,
        otherUser: Info,
        isTurnSkip: boolean,
        sio: io.Server,
        databaseService: DatabaseService,
        userListManager: UserListManager,
    ) {
        if (isTurnSkip) {
            room.gameService.consecutiveTurnsPassed++;
            this.sendMessage(otherUser.id, `${user.name} a passé son tour`, 'System', sio);
            this.sendMessage(user.id, 'Vous avez passé votre tour', 'System', sio);
            if (room.gameService.consecutiveTurnsPassed === Constants.MAX_TURNS_SKIPPED) {
                room.gameService.isGameOver = true;
                sio.to(room.name).emit('gameOver', room.gameService.declareWinner(user, otherUser, false));
                const msgList = room.gameService.rackLettersRemaining(user, otherUser);
                for (const msg of msgList) {
                    this.sendMessage(room.name, msg, 'System', sio);
                }
                sio.to(user.id).emit('updatePoints', user.points);
                sio.to(user.id).emit('updateOpponentPoints', otherUser.points);
                sio.to(otherUser.id).emit('updatePoints', otherUser.points);
                sio.to(otherUser.id).emit('updateOpponentPoints', user.points);
                if (room.isSolo) databaseService.addToDatabase(user.name, user.points, room.mode);
                else databaseService.updateBothScores(user.name, user.points, otherUser.name, otherUser.points, room.mode);
                if (room.match.playerOneName === user.name) room.match.getEndingMatchInfo(user.points, otherUser.points, this.duration, room.isSolo);
                else room.match.getEndingMatchInfo(otherUser.points, user.points, this.duration, room.isSolo);
                databaseService.insertData('MatchHistory', room.match);
                setTimeout(() => {
                    sio.emit('matches', databaseService.matchHistory);
                }, Constants.TIME.ADMIN_TIME);
                this.stopSendingInfo(room);
            }
        } else room.gameService.consecutiveTurnsPassed = 0;
        if (!room.gameService.isGameOver) {
            sio.to(room.name).emit('currentPlayerTurn', otherUser);
            room.playerTurnID = otherUser.id;
            room.gameService.togglePlayerTurn();
            if (room.isSolo) this.aiPlay(room, userListManager);
        }
    }

    aiPlay(room: Room, userListManager: UserListManager) {
        const aiService = userListManager.findAIServiceFromRoom(room.name) as AIService;
        if (room.isExpert) aiService.placeWord();
        else aiService.aiActions();
    }

    startSendingInfo(room: Room, userListManager: UserListManager, sio: io.Server, databaseService: DatabaseService) {
        room.timer = setInterval(() => {
            const user = userListManager.findUser(room.playerTurnID);
            if (user) {
                if (room.gameService.timeLeft === 0) {
                    room.gameService.timeLeft = Constants.TIME.TIMER;
                    const otherUserID = room.idList[1 - room.idList.indexOf(user.id)];
                    const otherUser = userListManager.findUser(otherUserID) as Info;
                    this.handleEndTurn(room, user, otherUser, true, sio, databaseService, userListManager);
                }
                if (user.id === room.playerTurnID && !room.gameService.isGameOver) {
                    const panel = new Panel(room.gameService.getTimeLeft(), user.name, room.lettersService.getRemainingLetters());
                    sio.to(room.name).emit('getPanelInfo', panel);
                }
            }
        }, Constants.TIME.INTERVAL);
    }

    stopSendingInfo(room: Room) {
        const interval = room.timer as NodeJS.Timer;
        if (interval) clearInterval(room.timer as NodeJS.Timer);
    }

    startGame(host: Info, guest: Info, room: Room, userListManager: UserListManager, sio: io.Server, databaseService: DatabaseService) {
        room.lettersService = new LettersService();
        if (room.isSolo) room.match.getInitialMatchInfo(host.name, guest.name + ' (JV)', room.mode, room.isSolo);
        else room.match.getInitialMatchInfo(host.name, guest.name, room.mode, room.isSolo);
        for (const user of userListManager.allUserInfo) {
            if (user.id === host.id || user.id === guest.id) user.points = 0;
            if (user.id === guest.id) {
                user.room = host.room;
                user.mode = host.mode;
            }
        }
        room.idList.push(guest.id);
        room.idList = room.idList.filter((id, index) => {
            return room.idList.indexOf(id) === index;
        });
        room.gameService.roomTime = room.time;
        room.playerTurnID = room.idList[Math.floor(Math.random() * room.idList.length)];
        room.gameService.startTimer();
        userListManager.fullUserList.push(host);
        userListManager.fullUserList.push(guest);
        userListManager.fullUserList = userListManager.allUserInfo.filter((objFromAllRoom) => {
            return !userListManager.fullUserList.find((objFromFullRoom) => {
                return objFromAllRoom.room === objFromFullRoom.room || !objFromAllRoom.room;
            });
        });
        sio.emit('roomListMessage', userListManager.availableUserList);
        const currentPlayer = userListManager.findUser(room.playerTurnID) as Info;
        sio.to(host.id).emit('gameStart', host.room);
        sio.to(host.id).emit('userInfo', host);
        sio.to(host.id).emit('opponentInfo', guest);
        sio.to(host.id).emit('currentPlayerTurn', currentPlayer);
        const aiService = userListManager.findAIServiceFromRoom(room.name) as AIService;
        if (aiService.user.id !== guest.id) {
            sio.to(guest.id).emit('gameStart', host.room);
            sio.to(guest.id).emit('userInfo', guest);
            sio.to(guest.id).emit('opponentInfo', host);
            sio.to(guest.id).emit('currentPlayerTurn', currentPlayer);
        } else aiService.user.rack.rack = room.lettersService.distributeLetters(Constants.RACK_LENGTH);
        if (room.mode === 'LOG2990') room.objectiveManager.initializeObjectives(sio, host, room);
        this.startSendingInfo(room, userListManager, sio, databaseService);
        if (currentPlayer.name === aiService.user.name) this.aiPlay(room, userListManager);
    }

    abandonGame(room: Room, loser: Info, otherUser: Info, userListManager: UserListManager, databaseService: DatabaseService, sio: io.Server) {
        room.gameService.stopSendingInfo(room);
        if (room.isSolo) {
            room.match.abandon = true;
            if (room.match.playerOneName === loser.name)
                room.match.getEndingMatchInfo(loser.points, otherUser.points, room.gameService.duration, room.isSolo);
            else room.match.getEndingMatchInfo(otherUser.points, loser.points, room.gameService.duration, room.isSolo);
            userListManager.removeRoom(room, loser);
            databaseService.insertData('MatchHistory', room.match);
            setTimeout(() => {
                sio.emit('matches', databaseService.matchHistory);
            }, Constants.TIME.ADMIN_TIME);
            room.gameService.stopTimer();
            return;
        }
    }

    replaceByAI(room: Room, loser: Info, otherUser: Info, userListManager: UserListManager, databaseService: DatabaseService, sio: io.Server) {
        room.match.solo = true;
        const ai = userListManager.findAIServiceFromRoom(room.name);
        if (ai) {
            ai.user.points = loser.points;
            ai.user.rack = loser.rack;
            if (room.playerTurnID === loser.id) room.playerTurnID = ai.user.id;
            let aiName = databaseService.aiNoviceNames[Math.floor(Math.random() * databaseService.aiNoviceNames.length)];
            while (otherUser.name === aiName.name) {
                aiName = databaseService.aiNoviceNames[Math.floor(Math.random() * databaseService.aiNoviceNames.length)];
            }
            ai.user.name = aiName.name;
            if (room.match.playerOneName === loser.name) room.match.playerOneName = aiName.name + ' (JV)';
            else room.match.playerTwoName = aiName.name + ' (JV)';
            room.idList.splice(room.idList.indexOf(loser.id), 1);
            loser.room = '';
            room.idList.push(ai.user.id);
            room.isSolo = true;
            if (ai.user.id === room.playerTurnID) room.gameService.aiPlay(room, userListManager);
            this.sendMessage(room.name, `${loser.name} a abandonné la partie, il est remplacé par ${ai.user.name}`, 'System', sio);
            sio.to(room.name).emit('opponentInfo', ai.user);
            room.gameService.startSendingInfo(room, userListManager, sio, databaseService);
        }
    }

    replacePlayer(hostID: string, userListManager: UserListManager, databaseService: DatabaseService, sio: io.Server) {
        const loser = userListManager.findUser(hostID);
        const room = userListManager.findInRoomList(hostID);
        if (room && loser) {
            const otherUserID = room.idList[1 - room.idList.indexOf(loser.id)];
            const otherUser = userListManager.findUser(otherUserID) as Info;
            this.abandonGame(room, loser, otherUser, userListManager, databaseService, sio);
            this.replaceByAI(room, loser, otherUser, userListManager, databaseService, sio);
        }
    }

    startSoloGame(room: Room, user: Info, userListManager: UserListManager, sio: io.Server, databaseService: DatabaseService) {
        const ai = userListManager.findAIServiceFromRoom(room.name);
        if (ai) {
            room.isSolo = true;
            room.idList.push(ai.user.id);
            room.idList = room.idList.filter((id, index) => {
                return room.idList.indexOf(id) === index;
            });
            room.gameService.startGame(user, ai.user, room, userListManager, sio, databaseService);
            userListManager.availableUserList.splice(userListManager.availableUserList.indexOf(user), 1);
        }
    }

    sendMessage(recipient: string, message: string, from: string, sio: io.Server) {
        const msg: Message = {
            title: from,
            body: message,
        };
        sio.to(recipient).emit('roomMessage', msg);
    }
}
