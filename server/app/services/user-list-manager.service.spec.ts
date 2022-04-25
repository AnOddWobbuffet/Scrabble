import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import { Rack } from '@common/classes/rack';
import { expect } from 'chai';
import * as http from 'http';
import * as io from 'socket.io';
import { AIService } from './ai.service';
import { DatabaseService } from './database.service';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';
import { UserListManager } from './user-list-manager.service';

describe('UserList service', () => {
    let userListManager: UserListManager;
    let info1Test: Info;
    let info2Test: Info;
    let room1: Room;
    let room2: Room;
    let sio: io.Server;
    let database: DatabaseService;

    beforeEach(async () => {
        userListManager = new UserListManager();
        const server = new http.Server();
        database = new DatabaseService();
        sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        info1Test = {
            id: 'id1',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 20,
            mode: '',
        };
        info2Test = {
            id: 'id2',
            name: 'testName2',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 10,
            mode: '',
        };
        room1 = {
            name: 'testRoom',
            board: new Board(),
            firstTurn: true,
            time: 60,
            idList: ['id1', 'id2'],
            gameService: new GameService(['aa']),
            lettersService: new LettersService(),
            playerTurnID: 'myTurn',
            isSolo: false,
            timer: null,
            isExpert: false,
            match: new Match(),
            mode: '',
            objectiveManager: new ObjectiveManager(),
        };
        room2 = {
            name: 'testRoom2',
            board: new Board(),
            firstTurn: true,
            time: 60,
            idList: ['id3', 'id4'],
            gameService: new GameService(['aa']),
            lettersService: new LettersService(),
            playerTurnID: 'myTurn2',
            isSolo: false,
            timer: null,
            isExpert: false,
            match: new Match(),
            mode: '',
            objectiveManager: new ObjectiveManager(),
        };
        userListManager.allUserInfo = [info1Test, info2Test];
        userListManager.availableUserList = [info1Test, info2Test];
        userListManager.fullUserList = [info1Test, info2Test];
    });

    it('findInRoomList should return user with matching id in roomList', (done: Mocha.Done) => {
        userListManager.roomList = [room1, room2];
        const idTest = 'id1';
        const room = userListManager.findInRoomList(idTest);
        expect(room).to.equal(room1);
        done();
    });

    it('findInRoomList should return undefined when no matching id found', (done: Mocha.Done) => {
        userListManager.roomList = [room1];
        const idTest = 'id4';
        const room = userListManager.findInRoomList(idTest);
        expect(room).to.not.equal(room1);
        expect(room).to.equal(undefined);
        done();
    });

    it('findIdInAllUserInfo should return user with matching id', (done: Mocha.Done) => {
        const idTest = 'id1';
        const user = userListManager.findUser(idTest);
        expect(user).to.equal(info1Test);
        done();
    });

    it('findUser should return undefined when no matching id or name found', (done: Mocha.Done) => {
        const idTest = 'testUndef';
        const user = userListManager.findUser(idTest);
        expect(user).to.equal(undefined);
        done();
    });

    it('findUser should return user with matching name when findName is set to true', (done: Mocha.Done) => {
        const nameTest = 'testName';
        const user = userListManager.findUser(nameTest, true);
        expect(user).to.equal(info1Test);
        done();
    });

    it('roomExistInAllUserInfo should return appropriate boolean', (done: Mocha.Done) => {
        userListManager.roomList = [room1, room2];
        let roomTest = 'testRoom';
        let room = userListManager.roomExistInAllUserInfo(roomTest);
        expect(room).to.equal(true);
        roomTest = 'failTest';
        room = userListManager.roomExistInAllUserInfo(roomTest);
        done();
    });

    it('findAIServiceFromRoom should return ai with matching room', (done: Mocha.Done) => {
        const ai1: AIService = new AIService(info1Test, sio, room1, userListManager, database);
        const ai2: AIService = new AIService(info2Test, sio, room2, userListManager, database);
        userListManager.aiList = [ai1, ai2];
        const roomTest = 'testRoom';
        const ai = userListManager.findAIServiceFromRoom(roomTest);
        expect(ai).to.equal(ai1);
        done();
    });

    it('findAIServiceFromRoom should return undefined when no matching room found', (done: Mocha.Done) => {
        const ai1: AIService = new AIService(info1Test, sio, room1, userListManager, database);
        const ai2: AIService = new AIService(info2Test, sio, room2, userListManager, database);
        userListManager.aiList = [ai1, ai2];
        const nameTest = 'testNameUndef';
        const ai = userListManager.findAIServiceFromRoom(nameTest);
        expect(ai).to.equal(undefined);
        done();
    });

    it('deleteEverything should remove user from lists if id found', (done: Mocha.Done) => {
        const idTest = 'id1';
        const allList = [info2Test];
        const availableList = [info2Test];
        const fullList = [info2Test];
        userListManager.deleteEverything(idTest);
        expect(userListManager.allUserInfo[0].id).to.equal(allList[0].id);
        expect(userListManager.availableUserList[0].id).to.equal(availableList[0].id);
        expect(userListManager.fullUserList[0].id).to.equal(fullList[0].id);
        done();
    });

    // eslint-disable-next-line max-len
    it("removeRoom should remove user from fullUserList, set user's room to empty and remove it's id from idList of the room if room has 2 players, if it has 1 player, the room is deleted", (done: Mocha.Done) => {
        const testId = 'id1';
        userListManager.roomList = [room1, room2];
        userListManager.removeRoom(room1, info1Test);
        expect(userListManager.fullUserList).to.not.contain(info1Test);
        expect(userListManager.allUserInfo[0].room).to.equal('');
        expect(userListManager.roomList[0].idList).to.not.contain(testId);
        userListManager.removeRoom(room1, info2Test);
        expect(userListManager.fullUserList).to.not.contain(info2Test);
        expect(userListManager.allUserInfo[0].room).to.equal('');
        expect(userListManager.roomList).to.not.contain(room1);
        done();
    });
});
