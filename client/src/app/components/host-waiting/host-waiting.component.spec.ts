import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Info } from '@common/classes/info';
import { Rack } from '@common/classes/rack';
import { ToastrModule } from 'ngx-toastr';
import { Socket } from 'socket.io-client';
import { HostWaitingComponent } from './host-waiting.component';

class SocketServiceMock extends SocketService {}

describe('HostWaitingComponent', () => {
    let component: HostWaitingComponent;
    let fixture: ComponentFixture<HostWaitingComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let router: Router;
    let location: Location;
    let info1: Info;
    let info2: Info;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        info1 = {
            id: 'testID1',
            name: 'testName1',
            room: 'testRoom1',
            time: 60,
            rack: new Rack(),
            points: 1,
            mode: '',
        };
        info2 = {
            id: 'testID2',
            name: 'testName2',
            room: 'testRoom2',
            time: 60,
            rack: new Rack(),
            points: 2,
            mode: '',
        };
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'game', component: GamePageComponent },
                    { path: 'classic_mode', component: ClassicModePageComponent },
                ]),
                HttpClientTestingModule,
                MatDialogModule,
                ToastrModule.forRoot(),
                BrowserAnimationsModule,
            ],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
            declarations: [HostWaitingComponent, GamePageComponent, ClassicModePageComponent],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HostWaitingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call configureBaseSocketFeatures', () => {
        const spyComponent = spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    });

    it('configureBaseSocketFeatures should call request', () => {
        const spyRequest = spyOn(component, 'request');
        component.configureBaseSocketFeatures();
        expect(spyRequest).toHaveBeenCalledTimes(1);
    });

    describe('Receiving events', () => {
        it('should handle gameStart event and redirect to game-page', fakeAsync(() => {
            socketHelper.peerSideEmit('gameStart');
            tick();
            expect(location.path()).toEqual('/game');
        }));

        it('should handle gameStart event and send a joinRoom event', fakeAsync(() => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'joinRoom';
            const roomString = 'test';
            socketHelper.peerSideEmit('gameStart', roomString);
            tick();
            expect(spy).toHaveBeenCalledWith(eventName, roomString);
        }));

        it('should handle someoneChangedIdea event and remove username', fakeAsync(() => {
            const waitingListSplice = [info1];
            component.waitingList.push(info1);
            component.waitingList.push(info2);
            socketHelper.peerSideEmit('someoneChangedIdea', info2.id);
            tick();
            expect(component.waitingList).toEqual(waitingListSplice);
        }));

        it('should handle dictDeleted event', fakeAsync(() => {
            const spy = spyOn(component.toastr, 'info');
            socketHelper.peerSideEmit('dictDeleted');
            tick();
            expect(spy).toHaveBeenCalledWith(
                'Le dictionnaire sélectionné pour cette partie a été remplacé par celui de défaut',
                'Dictionnaire supprimé',
            );
        }));
    });

    it('should add a player to waitingList array from server on joinRequest event', () => {
        socketHelper.peerSideEmit('joinRequest', info1);
        expect(component.waitingList.length).toBe(1);
        expect(component.waitingList).toContain(info1);
    });

    it('should add multiple players to waitingList array from server on multiple joinRequest events', () => {
        const testList = [info1, info2];
        testList.forEach((playerName) => socketHelper.peerSideEmit('joinRequest', playerName));
        expect(component.waitingList.length).toBe(testList.length);
        expect(component.waitingList).toEqual(testList);
    });

    it('click of button should call acceptRequest', fakeAsync(() => {
        const spy = spyOn(component, 'acceptRequest');
        component.waitingList.push(info1);
        component.waitingList.push(info2);
        fixture.detectChanges();
        fixture.debugElement.queryAll(By.css('.acceptPlayer'))[1].nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledOnceWith(info2);
    }));

    it('should send a acceptRequest and gameStarted event', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'acceptRequest';
        const eventName2 = 'gameStarted';
        const waitingListSplice = [info1];
        component.waitingList.push(info1);
        component.waitingList.push(info2);
        component.acceptRequest(info2);
        expect(spy).toHaveBeenCalledWith(eventName, info2);
        expect(spy).toHaveBeenCalledWith(eventName2, waitingListSplice);
    }));

    it('click of button should call deleteRequest', fakeAsync(() => {
        const spy = spyOn(component, 'deleteRequest');
        component.waitingList.push(info1);
        fixture.detectChanges();
        fixture.debugElement.queryAll(By.css('.refusePlayer'))[0].nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledOnceWith(info1);
    }));

    it('should send a deleteRequest event adn remove rejected player from waitingList', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'deleteRequest';
        component.waitingList.push(info1);
        component.waitingList.push(info2);
        component.deleteRequest(info2);
        expect(spy).toHaveBeenCalledWith(eventName, info2);
        expect(component.waitingList).not.toContain(info2);
    });

    it('click of button should call deleteRoom and redirect to classic_mode page', fakeAsync(() => {
        const spy = spyOn(component, 'deleteRoom');
        fixture.debugElement.query(By.css('#delete')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(location.path()).toEqual('/classic_mode');
    }));

    it('should send a deleteRoom event', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'deleteRoom';
        const requestTest: Info[] = [info1];
        component.waitingList = requestTest;
        component.deleteRoom();
        tick();
        expect(spy).toHaveBeenCalledWith(eventName, requestTest);
    }));

    it('should send a deleteRoom event', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'deleteRoom';
        const requestTest: Info[] = [info1];
        component.waitingList = requestTest;
        component.convertToSolo();
        tick();
        expect(spy).toHaveBeenCalledWith(eventName, requestTest);
    }));
});
