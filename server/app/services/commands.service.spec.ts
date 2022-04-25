/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Board } from '@app/classes/board/board';
import { Room } from '@app/classes/room/room';
import { Tile } from '@app/classes/tile/tile';
import { Info } from '@common/classes/info';
import { Match } from '@common/classes/match';
import { Rack } from '@common/classes/rack';
import { expect } from 'chai';
import * as http from 'http';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { AIService } from './ai.service';
import { CommandsService } from './commands.service';
import { DatabaseService } from './database.service';
import { GameService } from './game-service';
import { LettersService } from './letters-bank.service';
import { ObjectiveManager } from './objective-manager';
import { UserListManager } from './user-list-manager.service';

describe('Command service', () => {
    let commandService: CommandsService;
    let room: Room;
    let user1: Info;
    let user2: Info;
    let userListManager: UserListManager;
    let sio: io.Server;
    let aiService: AIService;
    let database: DatabaseService;
    beforeEach(async () => {
        const server = new http.Server();
        sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        commandService = new CommandsService();
        database = new DatabaseService();
        room = {
            name: 'testRoom',
            board: new Board(),
            firstTurn: true,
            time: 60,
            idList: ['test', 'test2'],
            gameService: new GameService(['test']),
            lettersService: new LettersService(),
            playerTurnID: 'myTurn',
            isSolo: false,
            timer: null,
            isExpert: false,
            match: new Match(),
            mode: '',
            objectiveManager: new ObjectiveManager(),
        };
        user1 = {
            id: 'test',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 20,
            mode: '',
        };
        user2 = {
            id: 'test2',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 20,
            mode: '',
        };
        userListManager = new UserListManager();
        userListManager.allUserInfo = [user1, user2];
        aiService = new AIService(user2, sio, room, userListManager, database);
        userListManager.aiList = [aiService];
    });
    it('should return appropriate message on incorrect syntax', () => {
        const splitMessage = ['!placer', 'salut'];
        const expectedMessage = 'Syntaxe incorrect, la syntaxe a suivre est la suivante: !placer <ligne><colonne>(h | v) <lettres>';
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message on invalid arguments', () => {
        const splitMessage = ['!placer', '8h', 'salut'];
        const expectedMessage = 'Arguments invalides';
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message on invalid arguments', () => {
        const splitMessage = ['!placer', 'h8haf5fg', 'salut'];
        const expectedMessage = 'Arguments invalides';
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message on invalid orientation', () => {
        const splitMessage = ['!placer', 'h8g', 'salut'];
        const expectedMessage = 'Largument orientation doit etre h ou v';
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message on first turn placement not on H8', () => {
        const splitMessage = ['!placer', 'a3h', 'salut'];
        const expectedMessage = 'Vous devez placer une lettre sur la case H8 lors du premier tour';
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message when Rack doesnt have letters', () => {
        const splitMessage = ['!placer', 'h8h', 'test'];
        const expectedMessage = "Commande impossible à réaliser: vous ne pouvez pas jouer ou echanger de lettres que vous n'avez pas!";
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message when Word is not in dictionary', () => {
        const splitMessage = ['!placer', 'h8h', 'tta'];
        const expectedMessage = 'Le mot tta ne fait pas partie du dictionnaire';
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message when row is incorrect', () => {
        const splitMessage = ['!placer', 'x8h', 'test'];
        const expectedMessage = 'Largument ligne nest pas valide(a-o sont les valeurs valides)';
        room.firstTurn = false;
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message when column is incorrect', () => {
        const splitMessage = ['!placer', 'h18h', 'test'];
        const expectedMessage = 'Largument colonne nest pas valide(1-15 sont les valeurs valides)';
        room.firstTurn = false;
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('HandleCommands should call handlePlace', () => {
        const spy = sinon.spy(commandService, 'handlePlace');
        const splitMessage = ['!placer', 'h8h', 'test'];
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        sinon.assert.called(spy);
    });
    it('ValidateWord should call all needed functions', () => {
        const spyVerify = sinon.spy(commandService, 'verifyFirstTurn');
        const spyCoord = sinon.spy(room.board, 'verificationCoord');
        const spyFull = sinon.spy(room.board, 'getFullWord');
        const spyWordValid = sinon.spy(room.gameService, 'isWordValid');
        const spyClone = sinon.spy(room.board, 'clone');
        const splitMessage = ['!placer', 'h8h', 'test'];
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        sinon.assert.called(spyVerify);
        sinon.assert.called(spyCoord);
        sinon.assert.called(spyFull);
        sinon.assert.called(spyWordValid);
        sinon.assert.called(spyClone);
    });
    it('verifyFirstTurn should return correct boolean value', () => {
        let bool = commandService.verifyFirstTurn(0, 0, true, 'test', room);
        expect(bool).to.equal(false);
        bool = commandService.verifyFirstTurn(7, 7, true, 'test', room);
        expect(bool).to.equal(true);
        bool = commandService.verifyFirstTurn(7, 7, false, 'test', room);
        expect(bool).to.equal(true);
        room.firstTurn = false;
        bool = commandService.verifyFirstTurn(0, 0, true, 'test', room);
        expect(bool).to.equal(true);
    });
    it('should return appropriate message when !echanger has incorrect syntax', () => {
        const splitMessage = ['!echanger', 'abc', 'hello'];
        const expectedMessage = 'Syntaxe invalide: suivre le format !echanger <lettres>';
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message when player tries to exchange letters during their opponents turn', () => {
        const splitMessage = ['!echanger', 'test'];
        const expectedMessage = "Ce n'est pas votre tour!";
        room.playerTurnID = user2.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should return appropriate message when player tries to exchange letters when there are less than 7 letters in the bank', () => {
        const splitMessage = ['!echanger', 'test'];
        const expectedMessage = 'Commande impossible à réaliser: la reserve a moins que 7 lettres!';
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        room.lettersService.remainingLetters = 5;
        const message = commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        expect(message).to.equal(expectedMessage);
    });
    it('should exchange letters when all the conditions are met', () => {
        const splitMessage = ['!echanger', 'test'];
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('A'), new Tile('A')];
        const spy = sinon.spy(room.lettersService, 'exchangeLetters');
        const originalLetters = [];
        for (const tile of user1.rack.rack) {
            originalLetters.push(tile.letter);
        }
        commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        const newLetters = [];
        for (const tile of user1.rack.rack) {
            newLetters.push(tile.letter);
        }
        expect(newLetters).not.to.equal(originalLetters);
        sinon.assert.called(spy);
    });
    it('should declare a winner when a players rack is empty and the bank is also empty', () => {
        const splitMessage = ['!placer', 'h8h', 'test'];
        room.playerTurnID = user1.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('-'), new Tile('-'), new Tile('-')];
        user2.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('B'), new Tile('C')];
        const winnerSpy = sinon.spy(room.gameService, 'declareWinner');
        room.lettersService.remainingLetters = 0;
        room.lettersService.lettersBank = [];
        expect(room.lettersService.lettersBank.length).to.equal(0);
        commandService.handleCommands(splitMessage, room, user1, sio, userListManager, database);
        const isEmpty = user1.rack.isEmpty();
        expect(isEmpty).to.equal(true);
        sinon.assert.called(winnerSpy);
    });
    it('should give hints when !indice is typed and give storage when !reserve is typed', () => {
        let splitMessage = ['!indice'];
        room.playerTurnID = user2.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('-'), new Tile('-'), new Tile('-')];
        aiService.user.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('B'), new Tile('C')];
        room.board.board[7][7] = new Tile('A');
        const spy = sinon.spy(commandService, 'handleHint');
        const spyStorage = sinon.spy(commandService, 'handleStorage');
        let msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        sinon.assert.called(spy);
        expect(msg).to.equal('');
        splitMessage = ['!reserve'];
        msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        sinon.assert.called(spyStorage);
        expect(msg).to.equal('Commande réserve effectuée avec succès');
    });
    it('should call handleHelp when !aide is typed', () => {
        const splitMessage = ['!aide'];
        const spy = sinon.spy(commandService, 'handleHelp');
        const msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        sinon.assert.called(spy);
        expect(msg).to.equal('');
    });
    it('handleHint should call setRack and getHints', () => {
        const spyRack = sinon.spy(aiService.aiHelper, 'setRack');
        const spyHint = sinon.spy(aiService.aiHelper, 'getHints');
        room.playerTurnID = user2.id;
        user1.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('-'), new Tile('-'), new Tile('-')];
        aiService.user.rack.rack = [new Tile('T'), new Tile('E'), new Tile('S'), new Tile('T'), new Tile('A'), new Tile('B'), new Tile('C')];
        room.board.board[7][7] = new Tile('A');
        commandService.handleHint(user2, room, userListManager, sio);
        sinon.assert.called(spyRack);
        sinon.assert.called(spyHint);
    });
    it('should return error message when command syntax is wrong', () => {
        let splitMessage = ['!indice', 'test'];
        let msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        expect(msg).to.equal('Syntaxe invalide, la commande !indice ne doit pas être suivie de texte');
        splitMessage = ['!reserve', 'test'];
        msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        expect(msg).to.equal('Syntaxe invalide, la commande !réserve ne doit pas être suivie de texte');
        splitMessage = ['!aide', 'test'];
        msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        expect(msg).to.equal('Syntaxe invalide, la commande !aide ne doit pas être suivie de texte');
        splitMessage = ['!reserve test'];
        msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        expect(msg).to.equal('La commande ' + splitMessage[0] + " n'est pas valide");
        splitMessage = ['!aide test'];
        msg = commandService.handleCommands(splitMessage, room, user2, sio, userListManager, database);
        expect(msg).to.equal('La commande ' + splitMessage[0] + " n'est pas valide");
    });
    it('handlePass return appropriate message', () => {
        let splitMessage = '!passerr';
        let expectedMessage = 'Commande invalide';
        room.playerTurnID = user2.id;
        let message = commandService.handlePass(splitMessage, room, sio, user2, userListManager, database);
        expect(message).to.equal(expectedMessage);
        splitMessage = '!passer';
        expectedMessage = "Ce n'est pas votre tour!";
        message = commandService.handlePass(splitMessage, room, sio, user1, userListManager, database);
        expect(message).to.equal(expectedMessage);
        message = commandService.handlePass(splitMessage, room, sio, user2, userListManager, database);
        expect(message).to.equal('');
    });
});
