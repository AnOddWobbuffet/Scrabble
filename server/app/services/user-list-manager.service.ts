import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Dictionnary } from '@common/classes/dictionnary';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import * as fs from 'fs';
import { Service } from 'typedi';
import { AIService } from './ai.service';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';

@Service()
export class UserListManager {
    allUserInfo: Info[];
    fullUserList: Info[];
    availableUserList: Info[];
    roomList: Room[];
    aiList: AIService[];

    constructor() {
        this.allUserInfo = [];
        this.fullUserList = [];
        this.availableUserList = [];
        this.roomList = [];
        this.aiList = [];
    }

    findInRoomList(userID: string): Room | undefined {
        for (const room of this.roomList) {
            if (room.idList.includes(userID)) {
                return room;
            }
        }
        return;
    }

    findUser(userInfo: string, findName: boolean = false): Info | undefined {
        for (const user of this.allUserInfo) {
            if (!findName) {
                if (user.id === userInfo) return user;
            } else {
                if (user.name === userInfo) return user;
            }
        }
        return;
    }

    roomExistInAllUserInfo(userRoom: string): boolean {
        for (const user of this.allUserInfo) {
            if (user.room === userRoom) {
                return true;
            }
        }
        return false;
    }

    findAIServiceFromRoom(roomName: string): AIService | undefined {
        for (const ai of this.aiList) {
            if (ai.user.room === roomName) {
                return ai;
            }
        }
        return;
    }

    addRoom(room: { name: string; time: number; isExpert: boolean; mode: string; dict: Dictionnary }, user: Info): Room {
        user.room = room.name;
        user.time = room.time;
        user.mode = room.mode;
        user.dict = room.dict;
        this.availableUserList.push(user);
        const newRoom: Room = {
            name: room.name,
            board: new Board(),
            firstTurn: true,
            time: room.time,
            idList: [user.id],
            gameService: new GameService(JSON.parse(fs.readFileSync(room.dict.path as string, 'utf-8')).words),
            lettersService: new LettersService(),
            playerTurnID: '',
            isSolo: false,
            timer: null,
            isExpert: room.isExpert,
            match: new Match(),
            mode: room.mode,
            objectiveManager: new ObjectiveManager(),
        };
        this.roomList.push(newRoom);
        return newRoom;
    }

    removeRoom(room: Room, user: Info) {
        this.fullUserList.splice(this.fullUserList.indexOf(user), 1);
        const userRoom = user.room;
        for (const availableUser of this.availableUserList) {
            if (availableUser.room === userRoom) this.availableUserList.splice(this.availableUserList.indexOf(availableUser), 1);
        }
        for (const allUser of this.allUserInfo) {
            if (allUser.room === userRoom) allUser.room = '';
        }
        user.room = '';
        if (room.idList.length <= 2) {
            this.roomList.splice(this.roomList.indexOf(room), 1);
        }
    }

    deleteEverything(disconnectedId: string) {
        this.allUserInfo.forEach((quitter, index) => {
            if (disconnectedId === quitter.id) this.allUserInfo.splice(index, 1);
        });
        this.availableUserList.forEach((quitter, index) => {
            if (disconnectedId === quitter.id) this.availableUserList.splice(index, 1);
        });
        this.fullUserList.forEach((quitter, index) => {
            if (disconnectedId === quitter.id) this.fullUserList.splice(index, 1);
        });
    }
}
