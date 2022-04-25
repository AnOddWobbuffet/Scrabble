import { Room } from '@app/classes/room/room';
import { Dictionnary } from '@common/classes/dictionnary';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Name } from '@common/classes/name';
import { Rack } from '@common/classes/rack';
import { Constants } from '@common/constants';
import * as fs from 'fs';
import * as http from 'http';
import * as io from 'socket.io';
import { AIService } from './ai.service';
import { CommandsService } from './commands.service';
import { DatabaseService } from './database.service';
import { GameService } from './game-service';
import { UserListManager } from './user-list-manager.service';

export class SocketManager {
    sio: io.Server;
    commandsService: CommandsService;
    databaseService: DatabaseService;
    aiNumber: number;
    constructor(server: http.Server, public userListManager: UserListManager) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, maxHttpBufferSize: 1e7 });
        this.commandsService = new CommandsService();
        this.databaseService = new DatabaseService();
        this.aiNumber = 0;
    }

    sendMessage(recipient: string, message: string, from: string) {
        const msg: Message = {
            title: from,
            body: message,
        };
        this.emitEventTo(recipient, 'roomMessage', msg);
    }

    emitEventTo(id: string, event: string, params: unknown) {
        if (params != null) this.sio.to(id).emit(event, params);
        else this.sio.to(id).emit(event);
    }

    updateAdminPage() {
        this.sio.emit('matches', this.databaseService.matchHistory);
        this.sio.emit('dictionnaries', this.databaseService.dictionnaries);
        this.sio.emit('noviceNames', this.databaseService.aiNoviceNames);
        this.sio.emit('expertNames', this.databaseService.aiExpertNames);
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            socket.on('playerTurnEnd', (isTurnSkip: boolean) => {
                const room = this.userListManager.findInRoomList(socket.id);
                const user = this.userListManager.findUser(socket.id);
                if (room && user) {
                    const otherUserID = room.idList[1 - room.idList.indexOf(socket.id)];
                    const otherUser = this.userListManager.findUser(otherUserID) as Info;
                    room.gameService.handleEndTurn(room, user, otherUser, isTurnSkip, this.sio, this.databaseService, this.userListManager);
                }
            });

            socket.on('requestInitialLetters', () => {
                const room = this.userListManager.findInRoomList(socket.id);
                const user = this.userListManager.findUser(socket.id);
                if (user && room) {
                    user.rack.rack = room.lettersService.distributeLetters(Constants.RACK_LENGTH);
                    this.emitEventTo(user.id, 'distributeInitialLetters', user.rack.rack);
                    const currentPlayer = this.userListManager.findUser(room.playerTurnID) as Info;
                    this.emitEventTo(room.name, 'currentPlayerTurn', currentPlayer);
                }
            });

            socket.on('requestBoardData', () => {
                const room = this.userListManager.findInRoomList(socket.id);
                if (room) this.emitEventTo(room.name, 'receiveBoardData', room.board.board);
            });
            // Board
            socket.on('roomMessage', (message: string) => {
                let messageBody = '';
                const splitMessage = message.split(' ');
                const room = this.userListManager.findInRoomList(socket.id);
                const user = this.userListManager.findUser(socket.id);
                if (user && room) {
                    if (message[0] === '!' && !room.gameService.isGameOver) {
                        messageBody = this.commandsService.handleCommands(
                            splitMessage,
                            room,
                            user,
                            this.sio,
                            this.userListManager,
                            this.databaseService,
                        );
                        setTimeout(() => this.emitEventTo(room.name, 'receiveBoardData', room.board.board), Constants.TIME.VALIDATION_INTERVAL);
                        this.sendMessage(user.id, messageBody, 'System');
                    } else if (message.length > Constants.MAX_LENGTH_MESSAGE) {
                        this.sendMessage(socket.id, 'Erreur: le message dépasse la limite de 512 caractères', 'System');
                    } else this.sendMessage(room.name, message, socket.id);
                }
            });
            // Game creation: 1.0. create username
            socket.on('addUsername', (username: string) => {
                if (this.userListManager.allUserInfo.some((user) => user.name === username)) {
                    this.emitEventTo(socket.id, 'usernameCreationError', "Le nom d'utilisateur existe déjà.");
                } else {
                    const newUser: Info = {
                        id: `${socket.id}`,
                        name: username,
                        room: '',
                        time: NaN,
                        rack: new Rack(),
                        points: 0,
                        mode: '',
                    };
                    this.userListManager.allUserInfo.push(newUser);
                    this.emitEventTo(socket.id, 'usernameCreationConfirmed', true);
                }
            });
            // ai name verification
            socket.on('playerName', () => {
                const user = this.userListManager.findUser(socket.id);
                if (user) this.emitEventTo(socket.id, 'getPlayerName', user.name);
            });
            // Game creation: 2.0 create room
            socket.on('addRoom', (room: { name: string; time: number; isExpert: boolean; mode: string; dict: Dictionnary }) => {
                const roomExists = this.userListManager.roomExistInAllUserInfo(room.name);
                if (roomExists) this.emitEventTo(socket.id, 'roomCreationError', 'Le nom de la salle existe déjà.');
                else {
                    for (const user of this.userListManager.allUserInfo) {
                        if (user.id === socket.id) {
                            const newRoom = this.userListManager.addRoom(room, user) as Room;
                            socket.join(room.name);
                            // ai creation
                            const ai: Info = {
                                id: 'ai' + this.aiNumber++,
                                name: 'ai',
                                room: newRoom.name,
                                rack: new Rack(),
                                points: 0,
                                time: NaN,
                                mode: room.mode,
                            };
                            this.userListManager.allUserInfo.push(ai);
                            const aiService = new AIService(ai, this.sio, newRoom, this.userListManager, this.databaseService);
                            this.userListManager.aiList.push(aiService);
                            this.emitEventTo(socket.id, 'roomCreationConfirmation', null);
                            this.sio.emit('roomListMessage', this.userListManager.availableUserList);
                        }
                    }
                }
            });
            // Game creation 3.1 send all room info
            socket.on('roomList', () => this.sio.emit('roomListMessage', this.userListManager.availableUserList));
            // Game creation 3.2 host receive join request from guest and send it to host
            socket.on('requestJoinRoom', (room: Info) => {
                const user = this.userListManager.findUser(socket.id);
                if (user) this.emitEventTo(room.id, 'joinRequest', user);
            });
            // Game creation 4.0 send to guest accepted
            socket.on('acceptRequest', (guest: Info) => {
                const host = this.userListManager.findUser(socket.id) as Info;
                const room = this.userListManager.findInRoomList(socket.id) as Room;
                room.gameService.startGame(host, guest, room, this.userListManager, this.sio, this.databaseService);
                this.userListManager.availableUserList.splice(this.userListManager.availableUserList.indexOf(host), 1);
            });
            // Solo game creation
            socket.on('startSoloGame', () => {
                const room = this.userListManager.findInRoomList(socket.id) as Room;
                const host = this.userListManager.findUser(socket.id) as Info;
                room.gameService.startSoloGame(room, host, this.userListManager, this.sio, this.databaseService);
            });
            // Game creation 4.1 send to guest delete
            socket.on('deleteRequest', (guest: Info) => this.emitEventTo(guest.id, 'denial', 'hostKick'));
            // Game creation 4.2 send to guest no more room
            socket.on('deleteRoom', (waitingUserList: Info[]) => {
                const host = this.userListManager.findUser(socket.id);
                const room = this.userListManager.findInRoomList(socket.id);
                if (host && room) {
                    this.userListManager.removeRoom(room, host);
                    socket.leave(room.name);
                }
                waitingUserList.forEach((waiter) => this.emitEventTo(waiter.id, 'roomDeleted', 'gameDisappear'));
                this.sio.emit('roomListMessage', this.userListManager.availableUserList);
            });
            socket.on('wordPlaced', (data) => {
                let messageBody = '';
                const room = this.userListManager.findInRoomList(socket.id) as Room;
                const user = this.userListManager.findUser(socket.id) as Info;
                messageBody = this.commandsService.validateWord(data.pos.x, data.pos.y, data.word, data.h, room, user, this.sio);
                if (messageBody !== '') this.sendMessage(user.id, messageBody, 'System');
                else {
                    messageBody = room.board.addWord(
                        data.pos.x,
                        data.pos.y,
                        data.h,
                        data.word,
                        room,
                        user,
                        this.sio,
                        this.userListManager.allUserInfo,
                    );
                    this.emitEventTo(room.name, 'receiveBoardData', room.board.board);
                    this.sendMessage(user.id, messageBody, 'System');
                }
            });
            // Game creation 4.3 send to host when guest quick waiting page
            socket.on('changeIdea', (hostInfo: Info) => this.emitEventTo(hostInfo.id, 'someoneChangedIdea', socket.id));
            // Game creation confirm both host and guest that game is going to start
            socket.on('gameStarted', (waitingUserList: Info[]) => {
                waitingUserList.forEach((waiter) => {
                    const rejected = this.userListManager.findUser(waiter.name, true);
                    if (rejected) this.emitEventTo(rejected.id, 'roomDeleted', 'noBodyWantsToPlayWithYou');
                });
                this.sio.emit('roomListMessage', this.userListManager.availableUserList);
            });
            // Game creation join Room socket
            socket.on('joinRoom', (roomName) => socket.join(roomName));

            socket.on('deleteMSG', (dict: string) => {
                for (const user of this.userListManager.availableUserList) {
                    if ((user.dict as Dictionnary).title === dict) {
                        user.dict = JSON.parse(fs.readFileSync(Constants.DB.DEFAULT_DICT_PATH, 'utf-8')).title;
                        this.emitEventTo(user.id, 'dictDeleted', null);
                        for (const room of this.userListManager.roomList)
                            if (room.idList.includes(user.id))
                                room.gameService = new GameService(JSON.parse(fs.readFileSync(Constants.DB.DEFAULT_DICT_PATH, 'utf-8')).words);
                    }
                }
            });

            socket.on('updateDictWaitingRoom', (titles) => {
                for (const user of this.userListManager.availableUserList)
                    if ((user.dict as Dictionnary).title === titles.oldTitle) (user.dict as Dictionnary).title = titles.newTitle;
            });

            socket.on('aiName', (aiName: string) => {
                const room = this.userListManager.findInRoomList(socket.id);
                if (room) {
                    const ai = this.userListManager.findAIServiceFromRoom(room.name);
                    if (ai) ai.user.name = aiName;
                }
            });

            socket.on('abandonRequest', () => {
                const room = this.userListManager.findInRoomList(socket.id);
                if (room) {
                    room.gameService.replacePlayer(socket.id, this.userListManager, this.databaseService, this.sio);
                    socket.leave(room.name);
                }
            });

            socket.on('classicScores', () => this.sio.emit('classicScoreList', this.databaseService.bestClassicScores));

            socket.on('log2990Scores', () => this.sio.emit('log2990ScoreList', this.databaseService.bestLOG2990Scores));

            socket.on('removeRoom', () => {
                const user = this.userListManager.findUser(socket.id);
                const room = this.userListManager.findInRoomList(socket.id);
                if (user && room) {
                    this.userListManager.removeRoom(room, user);
                    socket.leave(room.name);
                    this.sendMessage(room.name, user.name + ' a quitté la salle', 'System');
                    room.gameService.stopSendingInfo(room);
                    room.gameService.stopTimer();
                }
            });

            socket.on('disconnect', (reason) => {
                if (reason === 'transport close' || reason === 'ping timeout') {
                    setTimeout(() => {
                        const room = this.userListManager.findInRoomList(socket.id);
                        if (room) {
                            room.gameService.replacePlayer(socket.id, this.userListManager, this.databaseService, this.sio);
                            this.userListManager.deleteEverything(socket.id);
                        }
                    }, Constants.TIME.DISCONNECT_INTERVAL);
                }
            });

            socket.on('deleteEverything', () => this.userListManager.deleteEverything(socket.id));

            socket.on('exchange', (letters: string) => {
                const userInfo = this.userListManager.findUser(socket.id) as Info;
                const room = this.userListManager.findInRoomList(socket.id) as Room;
                this.commandsService.handleExchange(
                    userInfo,
                    room,
                    ['!echanger', letters],
                    false,
                    this.sio,
                    this.userListManager.allUserInfo,
                    letters,
                );
            });

            socket.on('addName', (newName: Name) => {
                this.databaseService.insertData(Constants.DB.DATABASE_AI_NAMES, newName);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });
            socket.on('updateName', (data) => {
                const newName: Name = { name: data.formName, difficulty: data.difficulty };
                const filter = { name: data.name };
                this.databaseService.updateData(Constants.DB.DATABASE_AI_NAMES, filter, newName);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });
            socket.on('deleteName', (name: Name) => {
                const nameRemove = { name: name.name, difficulty: name.difficulty };
                this.databaseService.removeData(Constants.DB.DATABASE_AI_NAMES, nameRemove);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });
            socket.on('addDict', (dict: Dictionnary) => {
                this.databaseService.addDict(dict);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });
            socket.on('updateDict', (data) => {
                this.databaseService.updateDict(data.oldTitle, data.newTitle, data.newDesc);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });
            socket.on('deleteDict', (dictTitle: string) => {
                this.databaseService.deleteDict(dictTitle);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });

            socket.on('adminData', () => this.updateAdminPage());

            socket.on('resetPart', (part: string) => {
                this.databaseService.resetPart(part);
                setTimeout(() => this.updateAdminPage(), Constants.TIME.ADMIN_TIME);
            });

            socket.on('downloadRequest', (path: string) => {
                const dict = JSON.parse(fs.readFileSync(path, 'utf-8'));
                dict.path = path;
                this.emitEventTo(socket.id, 'downloadReceive', dict);
            });

            socket.on('rackSwap', (letters: string) => {
                const userInfo = this.userListManager.findUser(socket.id) as Info;
                const room = this.userListManager.findInRoomList(socket.id) as Room;
                room.objectiveManager.checkRack(letters, userInfo, room, this.sio);
            });
        });
    }
}
