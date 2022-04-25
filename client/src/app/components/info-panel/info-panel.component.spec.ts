/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Panel } from '@app/classes/panel/panel';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { Tile } from '@app/classes/tile/tile';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Info } from '@common/classes/info';
import { Rack } from '@common/classes/rack';
import { Socket } from 'socket.io-client';
import { InfoPanelComponent } from './info-panel.component';

class SocketServiceMock extends SocketService {}

describe('InfoPanelComponent', () => {
    let component: InfoPanelComponent;
    let fixture: ComponentFixture<InfoPanelComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let router: Router;
    let location: Location;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([{ path: 'classic_mode', component: ClassicModePageComponent }]),
                HttpClientTestingModule,
                MatDialogModule,
            ],
            declarations: [InfoPanelComponent],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(InfoPanelComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call configureBaseSocketFeatures', () => {
        const spySocket = spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(spySocket).toHaveBeenCalledTimes(1);
    });

    describe('Receiving events', () => {
        it('should handle userInfo event and set name', () => {
            const info: Info = {
                id: 'testID',
                name: 'testName',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 1,
                mode: '',
            };
            socketHelper.peerSideEmit('userInfo', info);
            expect(component.name).toEqual(info.name);
        });

        it('should handle opponentInfo event and set name', () => {
            const info: Info = {
                id: 'testID',
                name: 'testName',
                room: 'testRoom',
                time: 60,
                rack: new Rack(),
                points: 1,
                mode: '',
            };
            socketHelper.peerSideEmit('opponentInfo', info);
            expect(component.opponentName).toEqual(info.name);
        });

        it('should handle getPanelInfo event and set timeLeft, currentPlayer and remainingLetters', fakeAsync(() => {
            const panel: Panel = {
                time: 10,
                playerTurnName: 'nameTest',
                remainingLetters: 10,
            };
            socketHelper.peerSideEmit('getPanelInfo', panel);
            expect(component.timeLeft).toEqual(panel.time);
            expect(component.currentPlayer).toEqual(panel.playerTurnName);
            expect(component.remainingLetters).toEqual(panel.remainingLetters);
        }));

        it('should handle updatePoints event and set points', () => {
            const testPoints1 = 10;
            socketHelper.peerSideEmit('updatePoints', testPoints1);
            expect(component.points).toEqual(testPoints1);
        });

        it('should handle updateOpponentPoints event and set opponentPoints', () => {
            const testPoints1 = 5;
            socketHelper.peerSideEmit('updateOpponentPoints', testPoints1);
            expect(component.opponentPoints).toEqual(testPoints1);
        });

        it('should handle wordPlayed event and send a playerTurnEnd event', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'playerTurnEnd';
            socketHelper.peerSideEmit('wordPlayed');
            expect(spy).toHaveBeenCalledWith(eventName, false);
        });

        it('should handle gameOver event and set isGameOver, isDisabled and abandonConfirmed', () => {
            const testWin = 'me';
            socketHelper.peerSideEmit('gameOver', testWin);
            expect(component.isGameOver).toBeTrue();
            expect(component.abandonConfirmed).toBeTrue();
            expect(component.winner).toEqual(testWin);
        });

        it('should handle updateRack event and set currentLetter and showLetter is false when letters in rack is > 7', fakeAsync(() => {
            const rack: Rack = new Rack();
            rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E'), new Tile('F'), new Tile('G')];
            socketHelper.peerSideEmit('updateRack', rack);
            expect(component.currentLetters).toEqual(rack.rack.length);
            expect(component.showRackLetters).toEqual(false);
        }));

        it('should handle updateRack event and set currentLetter and showLetter is true when letters in rack is < 7', fakeAsync(() => {
            const rack: Rack = new Rack();
            rack.rack = [new Tile('A'), new Tile('B'), new Tile('C'), new Tile('D'), new Tile('E')];
            socketHelper.peerSideEmit('updateRack', rack);
            expect(component.currentLetters).toEqual(rack.rack.length);
            expect(component.showRackLetters).toBeTrue();
        }));

        it('should handle privateObjective event and set privateObjective', () => {
            const testObj = 'placer z';
            socketHelper.peerSideEmit('privateObjective', testObj);
            expect(component.privateObjective).toEqual(testObj);
        });

        it('should handle publicObjective event and set publicObjective', () => {
            const testObj = 'placer z';
            socketHelper.peerSideEmit('publicObjective', testObj);
            expect(component.publicObjectives[0]).toEqual(testObj);
        });

        it('should handle removeObjective event and reset privateObjective', () => {
            const testObj = 'placer z';
            component.privateObjective = testObj;
            socketHelper.peerSideEmit('removeObjective', testObj);
            expect(component.completedObjectives.length).toEqual(2);
            expect(component.privateObjective).toEqual('');
        });

        it('should handle removeObjective event and remove objective from publicObjectives', () => {
            expect(component.completedObjectives.length).toEqual(0);
            const testObj = 'placer z';
            component.publicObjectives[0] = testObj;
            socketHelper.peerSideEmit('removeObjective', testObj);
            expect(component.completedObjectives.length).toEqual(2);
        });

        it('should handle opponentObjective event and push in completedObjectives', () => {
            const testObj = 'placer z';
            socketHelper.peerSideEmit('opponentObjective', testObj);
            expect(component.completedObjectives.length).toEqual(2);
            expect(component.completedObjectives[0]).toEqual(testObj);
        });

        it('should handle opponentLetters event and set opponentLetters', () => {
            const testPoints1 = 5;
            socketHelper.peerSideEmit('opponentLetters', testPoints1);
            expect(component.opponentLetters).toEqual(testPoints1);
        });
    });

    it('click of button should call abandon', fakeAsync(() => {
        component.abandonRequest = false;
        fixture.detectChanges();
        const spy = spyOn(component, 'abandon');
        fixture.debugElement.query(By.css('#returnButton')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('should send a removeRoom event and redirect to classic-mode-page', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'removeRoom';
        component.returnToMenu();
        expect(spy).toHaveBeenCalledWith(eventName);
        tick();
        expect(location.path()).toEqual('/classic_mode');
    }));
});
