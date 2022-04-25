/* eslint-disable max-lines */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { Tile } from '@app/classes/tile/tile';
import { InfoPanelComponent } from '@app/components/info-panel/info-panel.component';
import { RackComponent } from '@app/components/rack/rack.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Socket } from 'socket.io-client';
import { BoardComponent } from './board.component';

class SocketClientServiceMock extends SocketService {}

describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let rackComponent: RackComponent;
    let rackFixture: ComponentFixture<RackComponent>;
    let panelComponent: InfoPanelComponent;
    let panelFixture: ComponentFixture<InfoPanelComponent>;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;
    const BOARD_LENGTH = 15;
    const COLOR = 4;
    const TOTAL_BONUS_TILES = 60;
    const LETTER_SPACING = 20;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule, MatDialogModule],
            declarations: [BoardComponent],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        rackFixture = TestBed.createComponent(RackComponent);
        rackComponent = rackFixture.componentInstance;
        panelFixture = TestBed.createComponent(InfoPanelComponent);
        panelComponent = panelFixture.componentInstance;
        component.infoPanel = panelComponent;
        component.rackComp = rackComponent;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call initializeBoard and waitForBoardUpdates', () => {
        const spyBoard = spyOn(component, 'initializeBoard');
        const spySocket = spyOn(component, 'waitForBoardUpdates');
        component.ngOnInit();
        expect(spyBoard).toHaveBeenCalledTimes(1);
        expect(spySocket).toHaveBeenCalledTimes(1);
    });

    it('should handle receiveBoardData event by assigning it to board and call draw', () => {
        const board: Tile[][] = [];
        for (let i = 0; i < BOARD_LENGTH; i++) {
            board[i] = [];
            for (let j = 0; j < BOARD_LENGTH; j++) {
                board[i][j] = new Tile('A');
            }
        }
        const spy = spyOn(component, 'draw');
        socketHelper.peerSideEmit('receiveBoardData', board);
        expect(component.board).toEqual(board);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('initializeBoard should initialize all tiles with -', () => {
        component.initializeBoard();
        for (let i = 0; i < BOARD_LENGTH; i++) {
            for (let j = 0; j < BOARD_LENGTH; j++) {
                expect(component.board[i][j].letter).toEqual('-');
            }
        }
    });

    it('ngAfterViewInit should send a requestBoardData event and call resizeLetters', () => {
        const spy = spyOn(component.socketService, 'send');
        const spyResize = spyOn(component, 'resizeLetters');
        const spySizer = spyOn(component, 'sizer');
        const eventName = 'requestBoardData';
        component.ngAfterViewInit();
        expect(spy).toHaveBeenCalledWith(eventName);
        expect(spyResize).toHaveBeenCalled();
        expect(spySizer).toHaveBeenCalled();
    });

    it('draw should call makeTilesColor and makeBonusTiles', () => {
        const spyColor = spyOn(component, 'makeTilesColor');
        const spyTiles = spyOn(component, 'makeBonusTiles');
        component.draw();
        expect(spyColor).toHaveBeenCalledTimes(1);
        expect(spyTiles).toHaveBeenCalledTimes(1);
    });

    it('draw should call drawLetter as many times as tiles in a board', () => {
        const spy = spyOn(component, 'drawLetter');
        component.draw();
        expect(spy).toHaveBeenCalledTimes(BOARD_LENGTH * BOARD_LENGTH);
    });

    it('makeTilesColor should append color arrays to colorTiles', () => {
        const startingLength = component.colorTiles.length;
        expect(startingLength).toEqual(0);
        component.makeTilesColor();
        const endingLength = component.colorTiles.length;
        expect(endingLength).toEqual(COLOR);
    });

    it('makeBonusTiles should call makeStarTile, fillRect and fillText as many times as tiles of that color', () => {
        const spyStar = spyOn(component, 'makeStarTile');
        const fillRectSpy = spyOn(component.context, 'fillRect').and.callThrough();
        const fillTextSpy = spyOn(component.context, 'fillText').and.callThrough();
        component.makeTilesColor();
        component.makeBonusTiles();
        expect(spyStar).toHaveBeenCalledTimes(1);
        expect(fillRectSpy).toHaveBeenCalledTimes(TOTAL_BONUS_TILES);
        expect(fillTextSpy).toHaveBeenCalledTimes(TOTAL_BONUS_TILES * 2);
    });

    it('makeStarTile should call fillRect and fillText', () => {
        const fillRectSpy = spyOn(component.context, 'fillRect').and.callThrough();
        const fillTextSpy = spyOn(component.context, 'fillText').and.callThrough();
        component.makeStarTile();
        expect(fillRectSpy).toHaveBeenCalledTimes(1);
        expect(fillTextSpy).toHaveBeenCalledTimes(1);
    });

    it('drawLetter should not call fillRect and fillText if tile letter is -', () => {
        const fillTextSpy = spyOn(component.context, 'fillText').and.callThrough();
        const rectSpy = spyOn(component.context, 'rect').and.callThrough();
        const strokeSpy = spyOn(component.context, 'stroke').and.callThrough();
        const tile = new Tile('-');
        component.drawLetter(tile, LETTER_SPACING, LETTER_SPACING);
        expect(fillTextSpy).not.toHaveBeenCalled();
        expect(rectSpy).toHaveBeenCalledTimes(1);
        expect(strokeSpy).toHaveBeenCalledTimes(1);
    });

    it(' drawLetter should call fillRect and fillText if letter', () => {
        const fillRectSpy = spyOn(component.context, 'fillRect').and.callThrough();
        const fillTextSpy = spyOn(component.context, 'fillText').and.callThrough();
        const rectSpy = spyOn(component.context, 'rect').and.callThrough();
        const strokeSpy = spyOn(component.context, 'stroke').and.callThrough();
        const tile = new Tile('A');
        component.drawLetter(tile, LETTER_SPACING, LETTER_SPACING);
        expect(fillTextSpy).toHaveBeenCalledTimes(2);
        expect(fillRectSpy).toHaveBeenCalledTimes(1);
        expect(rectSpy).toHaveBeenCalledTimes(1);
        expect(strokeSpy).toHaveBeenCalledTimes(1);
    });

    it('resizeLetters should call draw and set the correct value to letterFont and pointsFont', () => {
        const spy = spyOn(component, 'draw');
        component.resizeLetters(BOARD_LENGTH);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.letterFont).toEqual(BOARD_LENGTH);
        expect(component.pointsFont).toEqual(BOARD_LENGTH / 2);
    });
    it('keyboardPressed should call addLetter if keyPressed is a letter in rack', () => {
        const spy = spyOn(component, 'addLetter');
        component.canWrite = true;
        component.rackComp.rack.rack = [new Tile('A'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a')];
        component.keyboardPressed('a');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('keyboardPressed should not call addLetter if keyPressed is a letter not in rack', () => {
        const spy = spyOn(component, 'addLetter');
        component.canWrite = true;
        component.rackComp.rack.rack = [new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a')];
        component.keyboardPressed('b');
        expect(spy).not.toHaveBeenCalled();
    });
    it('keyboardPressed should not call addLetter if player hasnt clicked on an empty Tile', () => {
        const spy = spyOn(component, 'addLetter');
        component.canWrite = false;
        component.rackComp.rack.rack = [new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a')];
        component.keyboardPressed('a');
        expect(spy).not.toHaveBeenCalled();
    });
    it('keyboardPressed should call addLetter if keyPressed is UpperCase and rack has *', () => {
        const spy = spyOn(component, 'addLetter');
        component.canWrite = true;
        component.rackComp.rack.rack = [new Tile('*'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a')];
        component.keyboardPressed('A');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('keyboardPressed should call addLetter with normalized letter if keyPressed is a special character', () => {
        const spy = spyOn(component, 'addLetter');
        component.canWrite = true;
        component.rackComp.rack.rack = [new Tile('A'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a'), new Tile('a')];
        component.keyboardPressed('à');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('removeLetter should call rack addLetter with the removed Key and should call all following methods', () => {
        const addLetterSpy = spyOn(rackComponent, 'addLetter');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        const boardDrawSpy = spyOn(component, 'draw');
        const boardHighlightSpy = spyOn(component, 'highlightWord');
        const boardArrowSpy = spyOn(component, 'drawArrow');
        component.wordPlaced = 'a';
        component.currentPos = { x: 1, y: 0 };
        component.horizontal = true;
        component.lastClickedPos = { x: 0, y: 0 };
        component.board[0][0] = new Tile('a');
        component.removeLetter();
        component.horizontal = false;
        component.removeLetter();
        expect(addLetterSpy).toHaveBeenCalledWith('a');
        expect(rackDrawSpy).toHaveBeenCalledTimes(2);
        expect(boardDrawSpy).toHaveBeenCalledTimes(2);
        expect(boardHighlightSpy).toHaveBeenCalledTimes(2);
        expect(boardArrowSpy).toHaveBeenCalledTimes(2);
        expect(component.wordPlaced).toEqual('');
    });
    it('keyboardPressed should call confirmWord when keyPressed is Enter', () => {
        const spy = spyOn(component, 'confirmWord');
        component.keyboardPressed('Enter');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('keyboardPressed should call cancelWord when keyPressed is Escape', () => {
        const spy = spyOn(component, 'cancelWord');
        component.keyboardPressed('Escape');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('keyboardPressed should call removeLetter when keyPressed is Backspace', () => {
        const spy = spyOn(component, 'removeLetter');
        component.keyboardPressed('Backspace');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('highlightTile should highlight the given Tile', () => {
        const rectSpy = spyOn(component.context, 'rect').and.callThrough();
        const strokeSpy = spyOn(component.context, 'stroke').and.callThrough();
        const pos = { x: 0, y: 0 };
        component.highlightTile(pos);
        expect(rectSpy).toHaveBeenCalledTimes(1);
        expect(strokeSpy).toHaveBeenCalledTimes(1);
    });
    it('highlightWord should call highlightTile for as many tiles as there are in the shown word', () => {
        const spy = spyOn(component, 'highlightTile');
        let pos = { x: 2, y: 0 };
        component.horizontal = true;
        component.lastClickedPos = { x: 0, y: 0 };
        component.highlightWord(pos);
        expect(spy).toHaveBeenCalledTimes(3);
        pos = { x: 0, y: 2 };
        component.horizontal = false;
        component.lastClickedPos = { x: 0, y: 0 };
        component.highlightWord(pos);
        const timesCalled = 6;
        expect(spy).toHaveBeenCalledTimes(timesCalled);
    });
    it('drawArrow should call fillText with correct orientation', () => {
        const spy = spyOn(component.context, 'fillText').and.callThrough();
        let pos = { x: 0, y: 0 };
        component.horizontal = true;
        component.drawArrow(pos);
        expect(spy).toHaveBeenCalled();
        pos = { x: 0, y: 0 };
        component.horizontal = false;
        component.drawArrow(pos);
        expect(spy).toHaveBeenCalled();
    });
    it('click event should call handleClick ', () => {
        const spy = spyOn(component, 'handleClick');
        fixture.debugElement.query(By.css('canvas')).triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('addLetter should call draws and removeLetter if currentPos is in board and should set variables with horizontal', () => {
        const addedLetter = 'a';
        const removeLetterSpy = spyOn(rackComponent, 'removeLetter');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        const boardDrawSpy = spyOn(component, 'draw');
        const boardHighlightSpy = spyOn(component, 'highlightWord');
        const boardArrowSpy = spyOn(component, 'drawArrow');
        component.wordPlaced = '';
        component.currentPos = { x: 0, y: 0 };
        component.horizontal = true;
        component.addLetter(addedLetter, addedLetter);
        expect(removeLetterSpy).toHaveBeenCalledWith(addedLetter);
        expect(rackDrawSpy).toHaveBeenCalledTimes(1);
        expect(boardDrawSpy).toHaveBeenCalledTimes(1);
        expect(boardHighlightSpy).toHaveBeenCalledTimes(1);
        expect(boardArrowSpy).toHaveBeenCalledTimes(1);
        expect(component.wordPlaced).toEqual(addedLetter);
        expect(component.currentPos.x).toEqual(1);
        expect(component.board[0][0].letter).toEqual(addedLetter);
    });
    it('addLetter should call draws and removeLetter if currentPos is in board and should set variables with !horizontal', () => {
        const addedLetter = 'a';
        const removeLetterSpy = spyOn(rackComponent, 'removeLetter');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        component.wordPlaced = '';
        component.currentPos = { x: 0, y: 0 };
        component.horizontal = false;
        component.addLetter(addedLetter, addedLetter);
        expect(removeLetterSpy).toHaveBeenCalledWith(addedLetter);
        expect(rackDrawSpy).toHaveBeenCalledTimes(1);
        expect(component.wordPlaced).toEqual(addedLetter);
        expect(component.currentPos.y).toEqual(1);
        expect(component.board[0][0].letter).toEqual(addedLetter);
    });
    it('addLetter should add board letter when passing on it', () => {
        const addedLetter = 'a';
        const existingLetter = 'b';
        const removeLetterSpy = spyOn(rackComponent, 'removeLetter');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        component.wordPlaced = '';
        component.currentPos = { x: 0, y: 0 };
        component.horizontal = true;
        component.board[0][1] = new Tile(existingLetter);
        component.addLetter(addedLetter, addedLetter);
        expect(removeLetterSpy).toHaveBeenCalledWith(addedLetter);
        expect(rackDrawSpy).toHaveBeenCalledTimes(1);
        expect(component.wordPlaced).toEqual(addedLetter + existingLetter);
        expect(component.currentPos.x).toEqual(2);
    });
    it('addLetter should add board letter when passing on it nonHorizontal', () => {
        const addedLetter = 'a';
        const existingLetter = 'b';
        const removeLetterSpy = spyOn(rackComponent, 'removeLetter');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        component.wordPlaced = '';
        component.currentPos = { x: 0, y: 0 };
        component.horizontal = false;
        component.board[1][0] = new Tile(existingLetter);
        component.addLetter(addedLetter, addedLetter);
        expect(removeLetterSpy).toHaveBeenCalledWith(addedLetter);
        expect(rackDrawSpy).toHaveBeenCalledTimes(1);
        expect(component.wordPlaced).toEqual(addedLetter + existingLetter);
        expect(component.currentPos.y).toEqual(2);
    });
    it('confirmWord should call wordPlaced and playerTurnEnd and should reset all values ', () => {
        const spy = spyOn(component.socketService, 'send');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        const eventName1 = 'wordPlaced';
        const eventName2 = 'playerTurnEnd';
        component.tempRack = [new Tile('a'), new Tile('b'), new Tile('c'), new Tile('d'), new Tile('e'), new Tile('f'), new Tile('g')];
        component.wordPlaced = 'abc';
        component.lastClickedPos = { x: 0, y: 0 };
        component.horizontal = true;
        const data = { word: 'abc', pos: component.lastClickedPos, h: true };
        component.confirmWord();
        expect(spy).toHaveBeenCalledWith(eventName1, data);
        expect(spy).toHaveBeenCalledWith(eventName2, false);
        expect(rackDrawSpy).toHaveBeenCalledTimes(1);
        expect(component.wordPlaced).toEqual('');
        expect(component.writing).toEqual(false);
        expect(component.canWrite).toEqual(false);
        expect(component.rackComp.rack.rack).toEqual(component.tempRack);
    });
    it('cancelWord should call requestBoardData and draw and should reset all values when keyPressed is Escape', () => {
        const spy = spyOn(component.socketService, 'send');
        const rackDrawSpy = spyOn(rackComponent, 'draw');
        const eventName = 'requestBoardData';
        component.canWrite = true;
        component.tempRack = [new Tile('a'), new Tile('b'), new Tile('c'), new Tile('d'), new Tile('e'), new Tile('f'), new Tile('g')];
        component.cancelWord();
        expect(spy).toHaveBeenCalledWith(eventName);
        expect(rackDrawSpy).toHaveBeenCalledTimes(1);
        expect(component.wordPlaced).toEqual('');
        expect(component.writing).toEqual(false);
        expect(component.canWrite).toEqual(false);
        expect(component.rackComp.rack.rack).toEqual(component.tempRack);
    });
    it('handleClick should call draw when left click on non empty Tile', () => {
        const drawSpy = spyOn(component, 'draw');
        const buttonEvent = {
            button: 0,
            offsetX: 1,
            offsetY: 1,
        } as MouseEvent;
        component.lastClickedPos = { x: 1, y: 1 };
        component.board[0][0] = new Tile('a');
        component.handleClick(buttonEvent);
        expect(drawSpy).toHaveBeenCalledTimes(1);
    });
    it('handleClick should call drawArrow when left click on empty Tile', () => {
        const drawArrowSpy = spyOn(component, 'drawArrow');
        const name = 'user';
        const buttonEvent = {
            button: 0,
            offsetX: 1,
            offsetY: 1,
        } as MouseEvent;
        component.writing = false;
        component.infoPanel.name = name;
        component.infoPanel.currentPlayer = name;
        component.handleClick(buttonEvent);
        expect(drawArrowSpy).toHaveBeenCalledTimes(1);
    });
});
