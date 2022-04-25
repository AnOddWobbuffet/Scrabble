/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { Dictionnary } from '@common/classes/dictionnary';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import { Rack } from '@common/classes/rack';
import { Constants } from '@common/constants';
import { Server } from 'app/server';
import { assert, expect } from 'chai';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { AIService } from './ai.service';
import { DatabaseService } from './database.service';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';
import { SocketManager } from './socket.manager';
const RESPONSE_DELAY = 200;

describe('SocketManager service tests', () => {
    let service: SocketManager;
    let server: Server;
    let clientSocket: Socket;
    let clientSocket2: Socket;
    let testInfo: Info;
    let testInfo2: Info;
    let testRoom: Room;
    let testAi: Info;
    let testAiService: AIService;
    let database: DatabaseService;

    const urlString = 'http://localhost:3000';

    beforeEach((done) => {
        server = Container.get(Server);
        server.init();
        service = server['socketManger'];
        clientSocket = ioClient(urlString);
        clientSocket2 = ioClient(urlString);
        database = new DatabaseService();
        setTimeout(() => {
            testInfo = {
                id: clientSocket.id,
                name: 'testUsername',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 0,
                mode: '',
            };
            testInfo2 = {
                id: clientSocket2.id,
                name: 'testUsername2',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 0,
                mode: '',
            };
            testAi = {
                id: 'ai',
                name: 'aiName',
                room: 'testRoom',
                rack: new Rack(),
                points: 0,
                time: NaN,
                mode: '',
            };
            testRoom = {
                name: 'testRoom',
                board: new Board(),
                firstTurn: true,
                time: 60,
                idList: [clientSocket.id, clientSocket2.id],
                gameService: new GameService(['test']),
                lettersService: new LettersService(),
                playerTurnID: clientSocket.id,
                isSolo: false,
                timer: null,
                isExpert: false,
                match: new Match(),
                mode: 'Classic',
                objectiveManager: new ObjectiveManager(),
            };
            testAiService = new AIService(testAi, service.sio, testRoom, service.userListManager, database);
            done();
        }, RESPONSE_DELAY);
    });

    afterEach(() => {
        clientSocket.close();
        clientSocket2.close();
        service.sio.close();
        sinon.restore();
    });

    it('should handle a addUsername event and add a user to allUserInfo', (done) => {
        const startingLength = service.userListManager.allUserInfo.length;
        const testUsername = 'username';
        const spy = sinon.spy(service, 'emitEventTo');
        clientSocket.emit('addUsername', testUsername);
        setTimeout(() => {
            const endingLength = service.userListManager.allUserInfo.length;
            assert(spy.withArgs(clientSocket.id, 'usernameCreationConfirmed', true).calledOnce);
            expect(startingLength).to.equal(0);
            expect(endingLength).to.equal(1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a addUsername event and add multiple users to allUserInfo', (done) => {
        const startingLength = service.userListManager.allUserInfo.length;
        const test3Usernames = ['username1', 'username2', 'username3'];
        const spy = sinon.spy(service, 'emitEventTo');
        test3Usernames.forEach((username) => {
            clientSocket.emit('addUsername', username);
        });
        setTimeout(() => {
            const endingLength = service.userListManager.allUserInfo.length;
            assert(spy.withArgs(clientSocket.id, 'usernameCreationConfirmed', true).calledThrice);
            expect(startingLength).to.equal(0);
            expect(endingLength).to.equal(3);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a addUsername event and not add a user already present in allUserInfo', (done) => {
        const test3Usernames = ['username1', 'username2', 'username3'];
        const testUsername = 'username2';
        const spy = sinon.spy(service, 'emitEventTo');
        test3Usernames.forEach((username) => {
            clientSocket.emit('addUsername', username);
        });
        clientSocket.emit('addUsername', testUsername);
        setTimeout(() => {
            const lengthAllUserInfo = service.userListManager.allUserInfo.length;
            assert(spy.withArgs(clientSocket.id, 'usernameCreationError', "Le nom d'utilisateur existe déjà.").calledOnce);
            expect(lengthAllUserInfo).to.equal(3);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a playerName event and emit a getPlayerName', (done) => {
        const spy = sinon.spy(service, 'emitEventTo');
        service.userListManager.allUserInfo.push(testInfo);
        clientSocket.emit('playerName');
        setTimeout(() => {
            assert(spy.calledWith(testInfo.id, 'getPlayerName', testInfo.name));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a addRoom event and push to fullRoomList and availableRoomList', (done) => {
        const dict = { title: 'My dice', description: 'I hecking love Scrabble', words: ['aa', 'bb', 'cc'] };
        sinon.stub(fs, 'readFileSync').returns(JSON.stringify(dict));
        service.userListManager.allUserInfo.push(testInfo);
        const startingLengthAvailableUserList = service.userListManager.availableUserList.length;
        const startingLengthRoomList = service.userListManager.roomList.length;
        const spy = sinon.spy(service, 'emitEventTo');
        const objToSend = { name: 'testDifferentRoom', time: 60, dict: { title: 'title' } };
        clientSocket.emit('addRoom', objToSend);
        setTimeout(() => {
            const endingLengthAvailableUserList = service.userListManager.availableUserList.length;
            const endingLengthRoomList = service.userListManager.roomList.length;
            expect(startingLengthAvailableUserList).to.equal(0);
            expect(startingLengthRoomList).to.equal(0);
            expect(endingLengthAvailableUserList).to.equal(1);
            expect(endingLengthRoomList).to.equal(1);
            assert(spy.withArgs(testInfo.id, 'roomCreationConfirmation', null).calledOnce);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a addRoom event and not push to fullRoomList and availableRoomList if room already exists', (done) => {
        const spy = sinon.spy(service, 'emitEventTo');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.roomList.push(testRoom);
        const objToSend = { name: testInfo.room, time: testInfo.time, dict: 'title' };
        clientSocket2.emit('addRoom', objToSend);
        setTimeout(() => {
            assert(spy.withArgs(testInfo2.id, 'roomCreationError', 'Le nom de la salle existe déjà.').calledOnce);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a joinRoom event and room size should equal 1', (done) => {
        clientSocket2.emit('joinRoom', 'testRoom');
        setTimeout(() => {
            const roomSize = service.sio.sockets.adapter.rooms.get('testRoom')?.size;
            expect(roomSize).to.equal(1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a requestJoinRoom event and emit a joinRequest event', (done) => {
        const spy = sinon.spy(service, 'emitEventTo');
        service.userListManager.allUserInfo.push(testInfo);
        clientSocket2.emit('requestJoinRoom', clientSocket.id);
        setTimeout(() => {
            expect(spy.calledOnceWith(testInfo.id, 'joinRequest', 'testRoom'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a deleteMSG event and emit a dictDeleted event and change the words in GameService', (done) => {
        const spy = sinon.spy(service, 'emitEventTo');
        const spyFS = sinon.spy(fs, 'readFileSync');
        testInfo.dict = { title: 'testTitle', description: 'testDesc' };
        service.userListManager.availableUserList.push(testInfo);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('deleteMSG', 'testTitle');
        setTimeout(() => {
            expect(spy.calledOnceWith(testInfo.id, 'dictDeleted', null));
            expect(spyFS.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a updateDictWaitingRoom event and change the dict title of user', (done) => {
        const data = { oldTitle: 'testTitle', newTitle: 'newTitle' };
        testInfo.dict = { title: 'testTitle', description: 'testDesc' };
        service.userListManager.availableUserList.push(testInfo);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('updateDictWaitingRoom', data);
        setTimeout(() => {
            expect((testInfo.dict as Dictionnary).title).to.equal(data.newTitle);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a changeIdea event and emit a someoneChangedIdea event', (done) => {
        const spy = sinon.spy(service, 'emitEventTo');
        clientSocket.emit('changeIdea', testInfo);
        setTimeout(() => {
            expect(spy.calledOnceWith(testInfo.id, 'someoneChangedIdea', clientSocket.id));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a deleteRequest event and emit a denial event', (done) => {
        clientSocket.emit('deleteRequest', testInfo);
        const spy = sinon.spy(service, 'emitEventTo');
        setTimeout(() => {
            assert(spy.calledWith(testInfo.id, 'denial', 'hostKick'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a roomList event and emit a roomListMessage event', (done) => {
        const spy = sinon.spy(service.sio, 'emit');
        clientSocket.emit('roomList');
        setTimeout(() => {
            assert(spy.withArgs('roomListMessage', service.userListManager.availableUserList).calledOnce);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a abandonRequest and turn the game into solo mode if there was multiplayer', (done) => {
        expect(testRoom.isSolo).to.equal(false);
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        service.userListManager.aiList.push(testAiService);
        service.databaseService.aiNoviceNames = [{ name: 'ai1', difficulty: 'Novice' }];
        clientSocket.emit('abandonRequest');
        setTimeout(() => {
            expect(testRoom.isSolo).to.equal(true);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a abandonRequest and remove the room if the game is solo', (done) => {
        const spyRemove = sinon.spy(service.userListManager, 'removeRoom');
        const spyTimer = sinon.spy(testRoom.gameService, 'stopTimer');
        testRoom.isSolo = true;
        testRoom.idList = [testInfo.id, testAi.id];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testAi);
        service.userListManager.roomList.push(testRoom);
        service.userListManager.aiList.push(testAiService);
        clientSocket.emit('abandonRequest');
        setTimeout(() => {
            assert(spyRemove.calledOnce);
            assert(spyTimer.calledOnce);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a acceptRequest event and call startGame', (done) => {
        const spyGameService = sinon.spy(testRoom.gameService, 'startGame');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.allUserInfo.push(testAi);
        service.userListManager.availableUserList.push(testInfo);
        service.userListManager.roomList.push(testRoom);
        service.userListManager.roomList[0].idList = [clientSocket.id];
        service.userListManager.aiList.push(testAiService);
        clientSocket.emit('acceptRequest', testInfo2);
        setTimeout(() => {
            assert(spyGameService.calledOnce);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a playerTurnEnd event and increment consecutiveTurnsPassed if player skip turn', (done) => {
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('playerTurnEnd', true);
        setTimeout(() => {
            expect(testRoom.gameService.consecutiveTurnsPassed).to.equal(1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a playerTurnEnd event and let the ai play if ai is the opponent', (done) => {
        const spy = sinon.spy(testRoom.gameService, 'aiPlay');
        testRoom.isSolo = true;
        testRoom.idList = [testInfo.id, testAi.id];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testAi);
        service.userListManager.roomList.push(testRoom);
        service.userListManager.aiList.push(testAiService);
        clientSocket.emit('playerTurnEnd', true);
        setTimeout(() => {
            assert(spy.calledWith(testRoom));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a playerTurnEnd event and set isGameOver to true if players skip a total of 6 times', (done) => {
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        for (let i = 0; i < 3; i++) {
            clientSocket.emit('playerTurnEnd', true);
            clientSocket2.emit('playerTurnEnd', true);
        }
        setTimeout(() => {
            expect(service.userListManager.roomList[0].gameService.consecutiveTurnsPassed).to.equal(6);
            expect(service.userListManager.roomList[0].gameService.isGameOver).to.equal(true);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a playerTurnEnd event and should set consecutiveTurnsPassed to 0', (done) => {
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('playerTurnEnd', false);
        setTimeout(() => {
            expect(service.userListManager.roomList[0].gameService.consecutiveTurnsPassed).to.equal(0);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a requestInitialLetters event and emit a distributeInitialLetters event + a currentPlayerTurn event', (done) => {
        const spyEmitTo = sinon.spy(service, 'emitEventTo');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        testRoom.playerTurnID = clientSocket.id;
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('requestInitialLetters');
        setTimeout(() => {
            assert(spyEmitTo.calledWith(clientSocket.id, 'distributeInitialLetters', testInfo.rack.rack));
            assert(spyEmitTo.calledWith(testRoom.name, 'currentPlayerTurn', testInfo));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a requestBoardData event and emit a receiveBoardData event', (done) => {
        const spyEmitTo = sinon.spy(service, 'emitEventTo');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('requestBoardData');
        setTimeout(() => {
            assert(spyEmitTo.calledWith(testRoom.name, 'receiveBoardData', testRoom.board.board));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a roomMessage event and call sendMessage if message is not a command', (done) => {
        const spySendMSG = sinon.spy(service, 'sendMessage');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('roomMessage', 'testMessage');
        setTimeout(() => {
            assert(spySendMSG.calledWith(testRoom.name, 'testMessage', clientSocket.id));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a roomMessage event and send an error message if message is too long', (done) => {
        const spySendMSG = sinon.spy(service, 'sendMessage');
        let testMessage = '';
        for (let i = 0; i < 520; i++) {
            testMessage += 'i';
        }
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('roomMessage', testMessage);
        setTimeout(() => {
            assert(spySendMSG.calledWith(clientSocket.id, 'Erreur: le message dépasse la limite de 512 caractères', 'System'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a roomMessage event and emit a receiveBoardData event + call sendMessage if message is a command', (done) => {
        const spySendMSG = sinon.spy(service, 'sendMessage');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        testRoom.playerTurnID = clientSocket.id;
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('roomMessage', '!placer h8h test');
        setTimeout(() => {
            const bodyMSG = "Commande impossible à réaliser: vous ne pouvez pas jouer ou echanger de lettres que vous n'avez pas!";
            assert(spySendMSG.calledWith(clientSocket.id, bodyMSG, 'System'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a deleteRoom event and emit a roomDeleted event + emit a roomListMessage event', (done) => {
        const spyEmitAll = sinon.spy(service.sio, 'emit');
        const spyEmitTo = sinon.spy(service, 'emitEventTo');
        const waitingUserList = [testInfo2];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.availableUserList.push(testInfo);
        testRoom.playerTurnID = clientSocket.id;
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('deleteRoom', waitingUserList);
        setTimeout(() => {
            assert(spyEmitTo.calledWith(testInfo2.id, 'roomDeleted', 'gameDisappear'));
            assert(spyEmitAll.calledWith('roomListMessage', service.userListManager.availableUserList));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a gameStarted event and emit a roomDeleted event + emit a roomListMessage event', (done) => {
        const spyEmitAll = sinon.spy(service.sio, 'emit');
        const spyEmitTo = sinon.spy(service, 'emitEventTo');
        const waitingUserList = [testInfo2];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.availableUserList.push(testInfo);
        testRoom.playerTurnID = clientSocket.id;
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('gameStarted', waitingUserList);
        setTimeout(() => {
            assert(spyEmitTo.calledWith(testInfo2.id, 'roomDeleted', 'noBodyWantsToPlayWithYou'));
            assert(spyEmitAll.calledWith('roomListMessage', service.userListManager.availableUserList));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a classicScores event and emit a classicScoreList event', (done) => {
        const spyEmit = sinon.spy(service.sio, 'emit');
        clientSocket.emit('classicScores');
        setTimeout(() => {
            assert(spyEmit.calledWith('classicScoreList', service.databaseService.bestClassicScores));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a log2990Scores event and emit a log2990ScoreList event', (done) => {
        const spyEmit = sinon.spy(service.sio, 'emit');
        clientSocket.emit('log2990Scores');
        setTimeout(() => {
            assert(spyEmit.calledWith('log2990ScoreList', service.databaseService.bestLOG2990Scores));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a removeRoom event and call removeRoom and sendMessage', (done) => {
        const spyRemoveRoom = sinon.spy(service.userListManager, 'removeRoom');
        const spySendMessage = sinon.spy(service, 'sendMessage');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('removeRoom');
        setTimeout(() => {
            assert(spyRemoveRoom.calledWith(testRoom, testInfo));
            assert(spySendMessage.calledWith(testRoom.name, testInfo.name + ' a quitté la salle', 'System'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a startSoloGame event and call startGame', (done) => {
        const spy = sinon.spy(testRoom.gameService, 'startGame');
        testRoom.idList = [testInfo.id];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testAi);
        service.userListManager.roomList.push(testRoom);
        service.userListManager.aiList.push(testAiService);
        clientSocket.emit('startSoloGame');
        setTimeout(() => {
            assert(spy.calledWith(testInfo, testAiService.user, testRoom));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a aiName event and change the name of the ai', (done) => {
        testRoom.idList = [testInfo.id];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.roomList.push(testRoom);
        service.userListManager.aiList.push(testAiService);
        const nameChange = 'anotherName';
        clientSocket.emit('aiName', nameChange);
        setTimeout(() => {
            expect(testAiService.user.name).to.equal(nameChange);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a wordPlaced event and send an error message to the user', (done) => {
        const spy = sinon.spy(service, 'sendMessage');
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        const data = { pos: { x: 1, y: 2 }, h: true, word: 'testWord' };
        clientSocket.emit('wordPlaced', data);
        setTimeout(() => {
            assert(spy.calledWith(testInfo.id, 'Vous devez placer une lettre sur la case H8 lors du premier tour', 'System'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a wordPlaced event and send a receiveBoard event', (done) => {
        const spyEmit = sinon.spy(service, 'emitEventTo');
        const spySendMessage = sinon.spy(service, 'sendMessage');
        testRoom.playerTurnID = testInfo.id;
        testInfo.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        const data = { pos: { x: 7, y: 7 }, h: true, word: 'test' };
        clientSocket.emit('wordPlaced', data);
        setTimeout(() => {
            assert(spyEmit.calledWith(testRoom.name, 'receiveBoardData', testRoom.board.board));
            assert(spySendMessage.calledWith(testInfo.id, 'Le mot test a été placé a la case H8', 'System'));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle an exchange event and call handleExchange', (done) => {
        const spy = sinon.spy(service.commandsService, 'handleExchange');
        const letters = 'abc';
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('exchange', letters);
        setTimeout(() => {
            assert(spy.calledWith(testInfo, testRoom, ['!echanger', letters], false, service.sio, service.userListManager.allUserInfo, letters));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a deleteEverything event and call deleteEverything from userListManager', (done) => {
        const spy = sinon.spy(service.userListManager, 'deleteEverything');
        service.userListManager.allUserInfo.push(testInfo);
        clientSocket.emit('deleteEverything');
        setTimeout(() => {
            assert(spy.calledWith(testInfo.id));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a addName event and call insertData from databaseService', (done) => {
        const spy = sinon.spy(service.databaseService, 'insertData');
        const newName = { name: 'testName', difficulty: 'Novice' };
        clientSocket.emit('addName', newName);
        setTimeout(() => {
            assert(spy.calledWith(Constants.DB.DATABASE_AI_NAMES, newName));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle an updateName event and call updateData from databaseService', (done) => {
        const spy = sinon.spy(service.databaseService, 'updateData');
        const data = { name: 'testName', difficulty: 'Novice', formName: 'updatedName' };
        const updatedName = { name: data.formName, difficulty: data.difficulty };
        const filter = { name: data.name };
        clientSocket.emit('updateName', data);
        setTimeout(() => {
            assert(spy.calledWith(Constants.DB.DATABASE_AI_NAMES, filter, updatedName));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a deleteName event and call removeData from databaseService', (done) => {
        const spy = sinon.spy(service.databaseService, 'removeData');
        const removeName = { name: 'testName', difficulty: 'Novice' };
        clientSocket.emit('deleteName', removeName);
        setTimeout(() => {
            assert(spy.calledWith(Constants.DB.DATABASE_AI_NAMES, removeName));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a addDict event and call writeFileSync and readFileSync from fs', (done) => {
        const dict = { title: 'Mon dictionnaire', description: 'Description de base', path: './assets/dictionnary.json' };
        service.databaseService.dictionnaries.push(dict);
        const spyPush = sinon.spy(service.databaseService.dictionnaries, 'push');
        const stubWrite = sinon.stub(fs, 'writeFileSync');
        const dictEmit = { title: 'testTitle!@#$%?&*()', description: 'testDesc', path: './assets/newDict.json' };
        clientSocket.emit('addDict', dictEmit);
        setTimeout(() => {
            assert(spyPush.called);
            assert(stubWrite.called);
            expect(service.databaseService.dictionnaries.length).to.equal(2);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle an updateDict event and call writeFileSync, readFileSync and renameSync from fs', (done) => {
        const dictInfo = { title: 'Mon dictionnaire', description: 'Description de base', path: './assets/dictionnary.json' };
        const dict = { title: 'My dict', description: 'Scrabble is very fun', words: ['aa', 'bb', 'cc'] };
        service.databaseService.dictionnaries.push(dictInfo);
        service.databaseService.dictionnaries.push(dict);
        const stubRename = sinon.stub(fs, 'renameSync');
        const stubWrite = sinon.stub(fs, 'writeFileSync');
        const stubRead = sinon.stub(fs, 'readFileSync').returns(JSON.stringify(dict));
        const data = { oldTitle: 'Mon dictionnaire', newTitle: 'newTitle', newDesc: 'testDesc' };
        clientSocket.emit('updateDict', data);
        setTimeout(() => {
            assert(stubRead.called);
            assert(stubRename.called);
            assert(stubWrite.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a deleteDict event and call writeFileSync and unlinkSync from fs', (done) => {
        const dictInfo = { title: 'Mon dictionnaire', description: 'Description de base', path: './assets/dictionnary.json' };
        const dict = { title: 'My dict', description: 'Scrabble is very fun', words: ['aa', 'bb', 'cc'] };
        service.databaseService.dictionnaries.push(dictInfo);
        service.databaseService.dictionnaries.push(dict);
        const spyWrite = sinon.stub(fs, 'writeFileSync');
        const spyUnlink = sinon.stub(fs, 'unlinkSync');
        const dictTitle = 'My dict';
        clientSocket.emit('deleteDict', dictTitle);
        setTimeout(() => {
            assert(spyWrite.called);
            assert(spyUnlink.called);
            expect(service.databaseService.dictionnaries.length).to.equal(1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a resetPart event and call resetDatabase of MatchHistory', (done) => {
        const spy = sinon.spy(service.databaseService, 'resetDatabase');
        clientSocket.emit('resetPart', 'MH');
        setTimeout(() => {
            assert(spy.calledWith(Constants.DB.DATABASE_MATCH_HISTORY));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a resetPart event and call resetDatabase of Dictionnary', (done) => {
        const stub = sinon.stub(service.databaseService, 'resetDict');
        clientSocket.emit('resetPart', 'Dict');
        setTimeout(() => {
            assert(stub.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a resetPart event and call resetDatabase of Scores', (done) => {
        const spy = sinon.spy(service.databaseService, 'resetDatabase');
        clientSocket.emit('resetPart', 'Scores');
        setTimeout(() => {
            assert(spy.calledWith(Constants.DB.DATABASE_CLASSIC_SCORES));
            assert(spy.calledWith(Constants.DB.DATABASE_LOG2990_SCORES));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a resetPart event and call resetDatabase of AiNames', (done) => {
        const spy = sinon.spy(service.databaseService, 'resetDatabase');
        clientSocket.emit('resetPart', 'AiNames');
        setTimeout(() => {
            assert(spy.calledWith(Constants.DB.DATABASE_AI_NAMES));
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a downloadRequest event and send a downloadReceive event', (done) => {
        const spy = sinon.spy(service, 'emitEventTo');
        const dict = { title: 'My dict', description: 'Scrabble is very fun', words: ['aa', 'bb', 'cc'] };
        const expectedDict = {
            title: 'My dict',
            description: 'Scrabble is very fun',
            words: ['aa', 'bb', 'cc'],
            path: './assets/dicts/My dict.json',
        };
        const path = './assets/dicts/My dict.json';
        sinon.stub(fs, 'readFileSync').returns(JSON.stringify(dict));
        clientSocket.emit('downloadRequest', path);
        setTimeout(() => {
            assert(spy.calledWith(testInfo.id, 'downloadReceive', expectedDict));
            done();
        }, RESPONSE_DELAY);
    });
    it('should handle a rackSwap event and call checkRack from objectiveManager', (done) => {
        const spy = sinon.spy(testRoom.objectiveManager, 'checkRack');
        const letters = 'abc';
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        clientSocket.emit('rackSwap', letters);
        setTimeout(() => {
            assert(spy.calledWith(letters, testInfo, testRoom, service.sio));
            done();
        }, RESPONSE_DELAY);
    });

    it('should skip the turn when timer reaches 0 when calling startSendingInfo', (done) => {
        const spy = sinon.spy(testRoom.gameService, 'handleEndTurn');
        testRoom.gameService.timeLeft = 0;
        testRoom.playerTurnID = testInfo.id;
        service.userListManager.allUserInfo.push(testInfo);
        service.userListManager.allUserInfo.push(testInfo2);
        service.userListManager.roomList.push(testRoom);
        testRoom.gameService.startSendingInfo(testRoom, service.userListManager, service.sio, service.databaseService);
        setTimeout(() => {
            assert(spy.calledWith(testRoom, testInfo, testInfo2));
            done();
        }, 2000);
    });

    it('should call updateAdminPage when calling adminData', (done) => {
        const spy = sinon.spy(service, 'updateAdminPage');
        clientSocket.emit('adminData');
        setTimeout(() => {
            assert(spy.called);
            done();
        }, 2000);
    });
});
