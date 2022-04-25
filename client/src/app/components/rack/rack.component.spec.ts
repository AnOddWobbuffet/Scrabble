/* eslint-disable max-lines */
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { Tile } from '@app/classes/tile/tile';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Info } from '@common/classes/info';
import { Rack } from '@common/classes/rack';
import { Socket } from 'socket.io-client';
import { RackComponent } from './rack.component';
class SocketClientServiceMock extends SocketService {}

describe('RackComponent', () => {
    let component: RackComponent;
    let fixture: ComponentFixture<RackComponent>;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;
    const RACK_LENGTH = 7;
    const LETTER_SPACING = 20;
    const TILE_SIZE = 40;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [RackComponent],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RackComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call configureBaseSocketFeatures', () => {
        const spy = spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    describe('Receiving events', () => {
        it('should handle distributeInitialLetters event and call draw', () => {
            const spy = spyOn(component, 'draw');
            const rack: Tile[] = [];
            for (let i = 0; i < RACK_LENGTH; i++) {
                const tile = new Tile('A');
                rack.push(tile);
            }
            socketHelper.peerSideEmit('distributeInitialLetters', rack);
            expect(component.rack.rack).toEqual(rack);
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('should handle updateRack event and call draw and send a playerTurnEnd event', fakeAsync(() => {
            const spy = spyOn(component, 'draw');
            const spySend = spyOn(component.socketService, 'send');
            const eventName = 'playerTurnEnd';
            const rack: Rack = new Rack();
            for (let i = 0; i < RACK_LENGTH; i++) {
                const tile = new Tile('A');
                rack.rack[i] = tile;
            }
            socketHelper.peerSideEmit('updateRack', rack);
            tick();
            expect(component.rack.rack).toEqual(rack.rack);
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spySend).toHaveBeenCalledWith(eventName, false);
        }));

        it('should handle requestRackLetters event', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'sendRackLetters';
            const rack: Tile[] = [];
            for (let i = 0; i < RACK_LENGTH; i++) {
                const tile = new Tile('A');
                rack.push(tile);
            }
            component.rack.rack = rack;
            socketHelper.peerSideEmit('requestRackLetters', component.rack);
            expect(spy).toHaveBeenCalledWith(eventName, component.rack);
        });

        it('should handle turnValidation event', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'sendTurnValidation';
            const boolTest = true;
            component.turnService.canMove = boolTest;
            socketHelper.peerSideEmit('turnValidation', component.turnService.getCanMove());
            expect(spy).toHaveBeenCalledWith(eventName, boolTest);
        });

        it('should handle userInfo event', () => {
            const eventName = 'userInfo';
            const info: Info = {
                id: 'testID',
                name: 'testName',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 1,
                mode: '',
            };
            socketHelper.peerSideEmit(eventName, info);
            expect(component.name).toEqual(info.name);
        });

        it('should handle panelInfo event', () => {
            const eventName = 'getPanelInfo';
            const panel = { time: 69, playerTurnName: 'hihi69', remainingLetters: 69 };
            socketHelper.peerSideEmit(eventName, panel);
            expect(component.remainingLetters).toEqual(panel.remainingLetters);
        });

        it('should handle currentPlayerTurn event and set isDisable to true', () => {
            const info: Info = {
                id: 'testID',
                name: 'testName',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 1,
                mode: '',
            };
            const nameTest = 'test';
            component.name = nameTest;
            socketHelper.peerSideEmit('currentPlayerTurn', info);
            expect(component.isDisabled).toBeTrue();
        });

        it('should handle currentPlayerTurn event and set isDisable to false', () => {
            const info: Info = {
                id: 'testID',
                name: 'testName',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 1,
                mode: '',
            };
            const nameTest = 'testName';
            component.name = nameTest;
            socketHelper.peerSideEmit('currentPlayerTurn', info);
            expect(component.isDisabled).toBeFalse();
        });

        it('should handle gameOver event and set isGameOver, isDisabled and abandonConfirmed', () => {
            const testWin = 'me';
            socketHelper.peerSideEmit('gameOver', testWin);
            expect(component.isDisabled).toBeTrue();
        });
    });

    it('ngAfterViewInit should call resizeLetters and requestInitialLetters', () => {
        const spyRequest = spyOn(component, 'requestInitialLetters');
        const spy = spyOn(component, 'resizeLetters');
        const size = 20;
        component.resizerService.size = size;
        component.resizerService.factor = 1;
        component.ngAfterViewInit();
        expect(spyRequest).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledOnceWith(size);
    });

    it('resizeLetters should call draw and set the correct value to letterFont and pointsFont', () => {
        const spy = spyOn(component, 'draw');
        component.resizeLetters(RACK_LENGTH);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.letterFont).toEqual(RACK_LENGTH);
        expect(component.pointsFont).toEqual(RACK_LENGTH / 2);
    });

    it('requestInitialLetters should send a requestInitialLetters event', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'requestInitialLetters';
        component.requestInitialLetters();
        expect(spy).toHaveBeenCalledWith(eventName);
    });

    it('click of button should call skipTurn if isDisable is false', fakeAsync(() => {
        const spy = spyOn(component, 'skipTurn');
        const bool = false;
        component.isDisabled = bool;
        const button = fixture.debugElement.query(By.css('#skip'));
        button.triggerEventHandler('click', null);
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('click of button should not call skipTurn if isDisable is true', fakeAsync(() => {
        const spy = spyOn(component, 'skipTurn');
        const bool = true;
        component.isDisabled = bool;
        fixture.debugElement.query(By.css('#skip')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(0);
    }));

    it('should send a playerTurnEnd event', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'playerTurnEnd';
        component.skipTurn();
        expect(spy).toHaveBeenCalledWith(eventName, true);
    });

    // Wheel part

    it('wheelDetect should call swapManipulation with left when deltaY < 0', () => {
        const LEFT = -1;
        const spy = spyOn(component, 'swapManipulation');
        const wheelEvent = {
            deltaY: -2,
        } as WheelEvent;
        component.wheelDetect(wheelEvent);
        expect(spy).toHaveBeenCalledWith(LEFT);
    });

    it('wheelDetect should call swapManipulation with left when deltaY > 0', () => {
        const RIGHT = 1;
        const spy = spyOn(component, 'swapManipulation');
        const wheelEvent = {
            deltaY: 2,
        } as WheelEvent;
        component.wheelDetect(wheelEvent);
        expect(spy).toHaveBeenCalledWith(RIGHT);
    });

    // Keyboard button part

    it('buttonDetect should call swapManipulation with left when key pressed is arrow left', () => {
        const spy = spyOn(component, 'mouseDetect');
        fixture.debugElement.query(By.css('canvas')).triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('buttonDetect should call swapManipulation with right when key pressed is arrow right', () => {
        const RIGHT = 1;
        const spy = spyOn(component, 'swapManipulation');
        spyOn(component, 'isActive').and.returnValue(true);
        const expectedKey = 'ArrowRight';
        const buttonEvent = {
            key: expectedKey,
        } as KeyboardEvent;
        component.buttonDetect(buttonEvent);
        expect(spy).toHaveBeenCalledWith(RIGHT);
    });

    it('buttonDetect should call swapManipulation with left when key pressed is arrow left', () => {
        const LEFT = -1;
        const spy = spyOn(component, 'swapManipulation');
        spyOn(component, 'isActive').and.returnValue(true);
        const expectedKey = 'ArrowLeft';
        const buttonEvent = {
            key: expectedKey,
        } as KeyboardEvent;
        component.buttonDetect(buttonEvent);
        expect(spy).toHaveBeenCalledWith(LEFT);
    });

    it('buttonDetect should call findLetterInRackManipulation when letter is in rack', () => {
        component.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        const spy = spyOn(component, 'findLetterInRackManipulation');
        spyOn(component, 'isActive').and.returnValue(true);
        const expectedKey = 'd';
        const buttonEvent = {
            key: expectedKey,
        } as KeyboardEvent;
        component.buttonDetect(buttonEvent);
        expect(spy).toHaveBeenCalledWith(expectedKey);
    });

    it('buttonDetect should call selectManipulation and manipulationHighlighted with right value when letter is not rack', () => {
        component.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        const spy = spyOn(component, 'selectManipulation');
        spyOn(component, 'isActive').and.returnValue(true);
        const expectedKey = 'z';
        const buttonEvent = {
            key: expectedKey,
        } as KeyboardEvent;
        component.buttonDetect(buttonEvent);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.manipulationHighlighted).toEqual(NaN);
    });

    // Draw part

    it('draw should call drawLetter as many times as the rack length', () => {
        const spy = spyOn(component, 'drawLetter');
        component.rack.rack.length = RACK_LENGTH;
        component.draw();
        expect(spy).toHaveBeenCalledTimes(RACK_LENGTH);
    });

    it('drawLetter should call fillText, rect and stroke', () => {
        const tile = new Tile('A');
        const fillTextSpy = spyOn(component.context, 'fillText').and.callThrough();
        const rectSpy = spyOn(component.context, 'rect').and.callThrough();
        const strokeSpy = spyOn(component.context, 'stroke').and.callThrough();
        component.drawLetter(tile, LETTER_SPACING * 2, 'nothing', false);
        expect(rectSpy).toHaveBeenCalledTimes(2);
        expect(fillTextSpy).toHaveBeenCalledTimes(2);
        expect(strokeSpy).toHaveBeenCalledTimes(1);
        expect(fillTextSpy).toHaveBeenCalled();
    });

    it('drawLetter should not call fillText, rect only once if letter is -', () => {
        const tile = new Tile('-');
        const fillTextSpy = spyOn(component.context, 'fillText').and.callThrough();
        const rectSpy = spyOn(component.context, 'rect').and.callThrough();
        const strokeSpy = spyOn(component.context, 'stroke').and.callThrough();
        component.drawLetter(tile, LETTER_SPACING * 2, 'nothing', false);
        expect(rectSpy).toHaveBeenCalledTimes(1);
        expect(fillTextSpy).toHaveBeenCalledTimes(0);
        expect(strokeSpy).toHaveBeenCalledTimes(1);
    });

    it('drawLetter should call fillRect with manipulation', () => {
        const tile = new Tile('A');
        const fillRectSpy = spyOn(component.context, 'fillRect').and.callThrough();
        component.drawLetter(tile, TILE_SIZE, 'manipulation', false);
        expect(fillRectSpy).toHaveBeenCalledTimes(1);
    });

    it('drawLetter should call fillRect with exchange is not selected', () => {
        const TO_BIG = 5;
        const fillRectSpy = spyOn(component.context, 'fillRect').and.callThrough();
        component.exchangeHighlighted = new Map([
            [0, 'a'],
            [1, 'b'],
            [2, 'c'],
        ]);
        const tile = new Tile('C');
        component.drawLetter(tile, TO_BIG * TILE_SIZE, 'exchange', false);
        expect(fillRectSpy).toHaveBeenCalledTimes(1);
    });

    // Exchange part

    it('drawExchange should call drawLetters the right number of times', () => {
        const spy = spyOn(component, 'drawLetter');
        component.drawExchange();
        expect(spy).toHaveBeenCalledTimes(RACK_LENGTH);
    });

    it('sendExchange should call socket service and send the right value, then call cancelExchange', () => {
        const socketSpy = spyOn(component.socketService, 'send');
        const cancelExchangeSpy = spyOn(component, 'cancelExchange');
        const eventName = 'exchange';
        const eventString = 'abc';
        const exchangeHighlighted: Map<number, string> = new Map([
            [1, 'a'],
            [2, 'b'],
            [3, 'c'],
        ]);
        component.sendExchange(exchangeHighlighted);
        expect(socketSpy).toHaveBeenCalledWith(eventName, eventString);
        expect(cancelExchangeSpy).toHaveBeenCalledTimes(1);
    });

    it('cancelExchange should clear the map and call deawExchange', () => {
        const spy = spyOn(component, 'drawExchange');
        const letterMap: Map<number, string> = new Map([
            [1, 'a'],
            [2, 'b'],
            [3, 'c'],
        ]);
        const mapSize = 0;
        component.cancelExchange(letterMap);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(letterMap.size).toEqual(mapSize);
    });

    // Manipulation part

    it('exchangeManipulation should change letters position in rack', () => {
        const indexA = 5;
        const indexB = 6;
        const tileA = new Tile('A');
        const tileB = new Tile('B');
        for (let i = 0; i < RACK_LENGTH; i++) {
            component.rack.rack.push(tileA);
        }
        component.rack.rack[indexB] = tileB;
        component.exchangeManipulation(indexA, indexB);
        expect(component.rack.rack[indexA]).toEqual(tileB);
    });

    it('swapManipulation should call exchangeManipulation selectManipulation with right values', () => {
        const exchangeSpy = spyOn(component, 'exchangeManipulation');
        const selectSpy = spyOn(component, 'selectManipulation');
        const tileA = new Tile('A');
        for (let i = 0; i < RACK_LENGTH; i++) {
            component.rack.rack.push(tileA);
        }
        const postion = 3;
        const direction = 1;
        component.manipulationHighlighted = 3;
        component.swapManipulation(direction);
        expect(selectSpy).toHaveBeenCalledTimes(1);
        expect(exchangeSpy).toHaveBeenCalledWith(postion, postion + 1);
    });

    it('selectManipulation should call draw and drawLetter with right values', () => {
        const drawSpy = spyOn(component, 'draw');
        const drawLetterSpy = spyOn(component, 'drawLetter');
        component.manipulationHighlighted = 3;
        component.selectManipulation();
        expect(drawSpy).toHaveBeenCalledTimes(1);
        expect(drawLetterSpy).toHaveBeenCalled();
    });

    it('findInRack should highlight the right tile', () => {
        const spy = spyOn(component, 'selectManipulation');
        const position = 2;
        component.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        component.manipulationHighlighted = 1;
        const startingPoint = 4;
        const letter = 'c';
        component.findInRack(startingPoint, letter);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(component.manipulationHighlighted).toEqual(position);
    });

    it('findLetterInRackManipulation should call find in rack with right values and nothing highlighted', () => {
        const spy = spyOn(component, 'findInRack');
        const letter = 'a';
        component.manipulationHighlighted = NaN;
        component.findLetterInRackManipulation(letter);
        expect(spy).toHaveBeenCalledWith(0, letter);
    });

    it('findLetterInRackManipulation should call find in rack with right values and wrong letter highlighted', () => {
        const spy = spyOn(component, 'findInRack');
        const letter = 'a';
        component.manipulationHighlighted = 1;
        component.rack.rack[component.manipulationHighlighted].letter = 'B';
        component.findLetterInRackManipulation(letter);
        expect(spy).toHaveBeenCalledWith(0, letter);
    });

    it('findLetterInRackManipulation should call find in rack with right values and same letter highlighted', () => {
        const spy = spyOn(component, 'findInRack');
        const letter = 'a';
        component.manipulationHighlighted = 1;
        component.rack.rack[component.manipulationHighlighted].letter = 'A';
        component.findLetterInRackManipulation(letter);
        expect(spy).toHaveBeenCalledWith(2, letter);
    });

    it('addLetter should add the right letter at the right place', () => {
        component.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('-')];
        component.addLetter('G');
        expect(component.rack.rack[6].letter).toEqual('G');
    });

    it('removeLetter should remove the right letter at the right place', () => {
        component.rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
        component.removeLetter('G');
        expect(component.rack.rack[6].letter).toEqual('-');
    });
});
