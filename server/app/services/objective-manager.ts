import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Constants } from '@common/constants';
import * as io from 'socket.io';

const EIGHT_LONG = 8;
const RACK_FIVE = 5;

export class ObjectiveManager {
    privateObjective1: string;
    privateObjective2: string;
    player1Id: string;
    publicObjectives: string[];
    wordsPlaced: string[];
    sio: io.Server;
    user: Info;
    opponentId: string;
    player1Star: boolean;
    player2Star: boolean;
    objectivesList: string[];

    constructor() {
        this.publicObjectives = [];
        this.wordsPlaced = [];
        this.player1Star = false;
        this.player2Star = false;
        this.objectivesList = Array.from(Constants.OBJECTIVES_LIST.keys());
    }

    checkObjectivesOnPlace(
        x: number,
        y: number,
        word: string,
        board: Board,
        sio: io.Server,
        user: Info,
        opponentId: string,
        isHorizontal: boolean,
        wordCount: number,
    ) {
        let userObjective = '';
        this.wordsPlaced.push(word);
        this.sio = sio;
        this.user = user;
        this.opponentId = opponentId;
        if (user.id === this.player1Id) userObjective = this.privateObjective1;
        else userObjective = this.privateObjective2;
        const fullWord = board.getFullWord(x, y, isHorizontal, word);
        this.checkBorder(x, y, word, userObjective, isHorizontal);
        this.checkZ(word, userObjective);
        this.checkThreeTimes(fullWord, userObjective);
        this.checkStarUsedTwice(word, userObjective);
        this.checkThreeInOne(wordCount, userObjective);
        this.checkEightLong(fullWord, userObjective);
        this.checkVowel(fullWord, userObjective);
    }

    checkBorder(x: number, y: number, word: string, privateObjective: string, isHorizontal: boolean) {
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[0];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            if (
                x === 0 ||
                y === 0 ||
                (x + word.length === Constants.BOARD.BOARD_LENGTH && isHorizontal) ||
                (y + word.length === Constants.BOARD.BOARD_LENGTH && !isHorizontal)
            ) {
                this.objectiveCompleted(objective, points, privateObjective);
            }
        }
    }

    checkZ(word: string, privateObjective: string): void {
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[1];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            if (word.includes('z') || word.includes('Z')) this.objectiveCompleted(objective, points, privateObjective);
        }
    }

    checkThreeTimes(word: string, privateObjective: string) {
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[2];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            let count = 0;
            for (const placedWord of this.wordsPlaced) {
                if (placedWord === word) count++;
            }
            if (count === 3) this.objectiveCompleted(objective, points, privateObjective);
        }
    }

    checkStarUsedTwice(word: string, privateObjective: string) {
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[4];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            for (const letter of word) {
                if (letter === letter.toUpperCase()) {
                    if (this.player1Id === this.user.id && !this.player1Star) {
                        this.player1Star = true;
                    } else if (this.player1Id === this.opponentId && !this.player2Star) {
                        this.player2Star = true;
                    } else if ((this.player1Id === this.user.id && this.player1Star) || (this.player1Id === this.opponentId && this.player2Star)) {
                        this.objectiveCompleted(objective, points, privateObjective);
                    }
                }
            }
        }
    }

    checkThreeInOne(wordCount: number, privateObjective: string) {
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[5];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            if (wordCount >= 3) {
                this.objectiveCompleted(objective, points, privateObjective);
            }
        }
    }

    checkEightLong(word: string, privateObjective: string) {
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[6];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            if (word.length >= EIGHT_LONG) {
                this.objectiveCompleted(objective, points, privateObjective);
            }
        }
    }

    checkVowel(word: string, privateObjective: string) {
        let vowels = true;
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[7];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        for (const letter of word) {
            if (!/^[aeiouy]$/i.test(letter)) {
                vowels = false;
                break;
            }
        }
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            if (word.length >= 3 && vowels) {
                this.objectiveCompleted(objective, points, privateObjective);
            }
        }
    }

    checkRack(rack: string, user: Info, room: Room, sio: io.Server) {
        let privateObjective = '';
        if (user.id === this.player1Id) privateObjective = this.privateObjective1;
        else privateObjective = this.privateObjective2;
        this.sio = sio;
        this.user = user;
        this.opponentId = room.idList[1 - room.idList.indexOf(user.id)];
        let ordered = false;
        let previousLetter = rack[0];
        let count = 1;
        const objective = Array.from(Constants.OBJECTIVES_LIST.keys())[3];
        const points = Constants.OBJECTIVES_LIST.get(objective) as number;
        for (let i = 1; i < rack.length; i++) {
            if (rack[i].charCodeAt(0) - previousLetter.charCodeAt(0) === 1) {
                count++;
                if (count === RACK_FIVE) ordered = true;
            } else count = 1;
            previousLetter = rack[i];
        }
        if (privateObjective === objective || this.publicObjectives.includes(objective)) {
            if (ordered) {
                this.objectiveCompleted(objective, points, privateObjective);
            }
        }
    }

    objectiveCompleted(objective: string, points: number, privateObjective: string) {
        this.user.points += points;
        this.sio.to(this.opponentId).emit('updateOpponentPoints', this.user.points);
        this.sio.to(this.user.id).emit('updatePoints', this.user.points);
        if (privateObjective === objective) {
            this.sio.to(this.user.id).emit('removeObjective', objective);
            this.sio.to(this.opponentId).emit('opponentObjective', objective);
            if (this.user.id === this.player1Id) this.privateObjective1 = '';
            else this.privateObjective2 = '';
        } else {
            this.sio.to(this.user.id).emit('removeObjective', objective);
            this.sio.to(this.opponentId).emit('removeObjective', objective);
            this.publicObjectives.splice(this.publicObjectives.indexOf(objective), 1);
        }
        this.sendMessage(this.user.id, `Vous avez completé l'objectif : ${objective} pour ${points} points`, 'System', this.sio);
        this.sendMessage(this.opponentId, `${this.user.name} a completé l'objectif : ${objective} pour ${points} points`, 'System', this.sio);
    }

    getRandomObjective(): string {
        const chosenObjective = this.objectivesList[Math.floor(Math.random() * this.objectivesList.length)];
        this.objectivesList.splice(this.objectivesList.indexOf(chosenObjective), 1);
        return chosenObjective;
    }

    initializeObjectives(sio: io.Server, user: Info, room: Room): void {
        this.player1Id = user.id;
        let objective = this.getRandomObjective();
        sio.to(user.id).emit('privateObjective', objective);
        this.privateObjective1 = objective;
        objective = this.getRandomObjective();
        sio.to(room.idList[1 - room.idList.indexOf(user.id)]).emit('privateObjective', objective);
        this.privateObjective2 = objective;
        objective = this.getRandomObjective();
        sio.to(user.id).emit('publicObjective', objective);
        sio.to(room.idList[1 - room.idList.indexOf(user.id)]).emit('publicObjective', objective);
        this.publicObjectives.push(objective);
        objective = this.getRandomObjective();
        sio.to(user.id).emit('publicObjective', objective);
        sio.to(room.idList[1 - room.idList.indexOf(user.id)]).emit('publicObjective', objective);
        this.publicObjectives.push(objective);
    }

    sendMessage(recipient: string, message: string, from: string, sio: io.Server) {
        const msg: Message = {
            title: from,
            body: message,
        };
        sio.to(recipient).emit('roomMessage', msg);
    }
}
