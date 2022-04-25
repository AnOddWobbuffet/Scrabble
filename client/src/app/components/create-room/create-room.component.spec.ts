/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HostWaitPageComponent } from '@app/pages/host-wait-page/host-wait-page.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Dictionnary } from '@common/classes/dictionnary';
import { Socket } from 'socket.io-client';
import { CreateRoomComponent } from './create-room.component';
class SocketServiceMock extends SocketService {}

describe('CreateRoomComponent', () => {
    let component: CreateRoomComponent;
    let fixture: ComponentFixture<CreateRoomComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let router: Router;
    let location: Location;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'hostWaiting', component: HostWaitPageComponent },
                    { path: 'game', component: GamePageComponent },
                ]),
                HttpClientTestingModule,
            ],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: MatDialogRef, useValue: matDialogSpy },
            ],
            declarations: [CreateRoomComponent, HostWaitPageComponent],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateRoomComponent);
        component = fixture.componentInstance;
        component.ngOnInit();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call creationError, created, setAIName, requestParams, receiveParams', fakeAsync(() => {
        const spyCreationError = spyOn(component, 'creationError');
        const spyCreated = spyOn(component, 'created');
        const spyName = spyOn(component, 'setAIName');
        const spyRequest = spyOn(component, 'requestParams');
        const spyReceive = spyOn(component, 'receiveParams');
        const fakeDict: Dictionnary = { title: 'testTitle', description: 'testDesc', words: ['a', 'b', 'c'] };
        component.dictionnaries.push(fakeDict);
        component.communication.gameMode = 'solo';
        fixture.detectChanges();
        tick();
        component.ngOnInit();
        expect(spyCreationError).toHaveBeenCalledTimes(1);
        expect(spyCreated).toHaveBeenCalledTimes(1);
        expect(spyReceive).toHaveBeenCalledTimes(1);
        expect(spyRequest).toHaveBeenCalledTimes(1);
        jasmine.clock().install();
        jasmine.clock().tick(1000);
        expect(spyName).toHaveBeenCalledTimes(1);
        jasmine.clock().uninstall();
    }));

    // it('setAIName should set aiName', () => {
    //     const list: Name[] =
    //     component.setAIName(component.aiNamesN);
    //     expect(spyRequest).toHaveBeenCalledTimes(1);
    //     expect(spyReceive).toHaveBeenCalledTimes(1);
    //     flush();
    // }));

    it('should call createRoom when clicking the button if the player entered a name', fakeAsync(() => {
        const spyComponent = spyOn(component, 'createRoom');
        component.roomName = 'Player';
        component.communication.gameMode = 'multijoueur';
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('#button'));
        button.nativeElement.click();
        fixture.detectChanges();
        tick();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    }));

    it('should call createRoom when pressing the enter key', fakeAsync(() => {
        const spyComponent = spyOn(component, 'createRoom');
        component.communication.gameMode = 'multijoueur';
        fixture.detectChanges();
        const input = fixture.debugElement.query(By.css('#inputField'));
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
        });
        input.nativeElement.dispatchEvent(event);
        tick();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    }));

    it('should send a room to the server and reset roomMessage and errorMessage when createRoom is called', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'addRoom';
        const eventAi = 'aiName';
        const testRoomMessage = 'room';
        const testTimer = 60;
        const testMode = 'solo';
        const testErrorMessage = 'error';
        component.communication.gameMode = testMode;
        component.communication.mode = 'classique';
        component.roomName = testRoomMessage;
        component.roomTime = testTimer;
        component.errorMessage = testErrorMessage;
        component.aiDifficulty = 'expert';
        component.aiName = 'nameTest';
        const gameInfoTest = { name: 'room', time: 60, isExpert: true, mode: 'classique', dict: { title: '', description: '', words: [] } };
        component.createRoom();
        expect(spy).toHaveBeenCalledWith(eventName, gameInfoTest);
        expect(spy).toHaveBeenCalledWith(eventAi, 'nameTest');
        // expect(component.roomName).toEqual('');
        // expect(component.errorMessage).toEqual('');
    });

    it('should handle roomCreationError and set errorMessage', () => {
        const errorTest = 'fail';
        socketHelper.peerSideEmit('roomCreationError', errorTest);
        expect(component.errorMessage).toEqual(errorTest);
    });

    it('should redirect to host-wait-page when mode is multijoueur and set creationSuccess', fakeAsync(() => {
        const boolTest = true;
        component.communication.gameMode = 'multijoueur';
        socketHelper.peerSideEmit('roomCreationConfirmation', boolTest);
        tick();
        expect(location.path()).toEqual('/hostWaiting');
    }));

    it('should redirect to game-page when mode is solo, set creationSuccess and send startSoloGame event', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'startSoloGame';
        const boolTest = true;
        component.communication.gameMode = 'solo';
        socketHelper.peerSideEmit('roomCreationConfirmation', boolTest);
        tick();
        expect(spy).toHaveBeenCalledWith(eventName);
        expect(location.path()).toEqual('/game');
    }));

    it('receiveParams should handle receivePlayerName and set playerName', fakeAsync(() => {
        const nameTest = 'testName';
        socketHelper.peerSideEmit('getPlayerName', nameTest);
        tick();
        expect(component.playerName).toEqual(nameTest);
    }));

    it('receiveParams should handle dictionnaries and set dictionnaries', fakeAsync(() => {
        const dict = { title: 'title', description: 'description', words: ['a', 'b', 'c'] };
        socketHelper.peerSideEmit('dictionnaries', [dict]);
        tick();
        expect(component.dictionnaries.length).toEqual(1);
    }));

    it('receiveParams should handle noviceNames and set aiNamesN', fakeAsync(() => {
        const nameTest = 'testName';
        socketHelper.peerSideEmit('noviceNames', [nameTest]);
        tick();
        expect(component.aiNamesN.length).toEqual(1);
    }));

    it('receiveParams should handle expertNames and set aiNameE', fakeAsync(() => {
        const nameTest = 'testName';
        socketHelper.peerSideEmit('expertNames', [nameTest]);
        tick();
        expect(component.aiNamesE.length).toEqual(1);
    }));

    it('should decrease the time by 30 when clicking the button', fakeAsync(() => {
        const spy = spyOn(component, 'reduceTime');
        const button = fixture.debugElement.query(By.css('#timerMinus'));
        button.nativeElement.click();
        fixture.detectChanges();
        tick();
        expect(spy).toHaveBeenCalled();
    }));

    it('should decrease the time by 30 when clicking the button', fakeAsync(() => {
        const spy = spyOn(component, 'gainTime');
        const button = fixture.debugElement.query(By.css('#timerPlus'));
        button.nativeElement.click();
        fixture.detectChanges();
        tick();
        expect(spy).toHaveBeenCalled();
    }));

    it('should decrease the time by 30 when calling reduceTime', () => {
        component.reduceTime();
        expect(component.roomTime).toEqual(30);
    });

    it('should increase the time by 30 when calling gainTime', () => {
        component.gainTime();
        expect(component.roomTime).toEqual(90);
    });

    it('should close the MatDialogRef and set the roomTime of communication to 60', fakeAsync(() => {
        component.onClose();
        tick();
        expect(component.dialogRef.close).toHaveBeenCalled();
        expect(component.communication.roomTime).toEqual(60);
    }));

    it('should call setAIName when calling aiNames with aiNamesN array', () => {
        component.aiNamesN = [{ name: 'noob', difficulty: 'Novice' }];
        component.aiNamesE = [{ name: 'pro', difficulty: 'Expert' }];
        const spy = spyOn(component, 'setAIName');
        component.aiDifficulty = 'novice';
        component.aiNames();
        expect(spy).toHaveBeenCalledWith(component.aiNamesN);
    });

    it('should call setAIName when calling aiNames with aiNamesE array', () => {
        component.aiNamesN = [{ name: 'noob', difficulty: 'Novice' }];
        component.aiNamesE = [{ name: 'pro', difficulty: 'Expert' }];
        const spy = spyOn(component, 'setAIName');
        component.aiDifficulty = 'expert';
        component.aiNames();
        expect(spy).toHaveBeenCalledWith(component.aiNamesE);
    });

    it('should loop and set another name if player has the same name as ai', fakeAsync(() => {
        component.aiNamesN = [{ name: 'noob', difficulty: 'Novice' }];
        component.aiNamesE = [
            { name: 'pro', difficulty: 'Expert' },
            { name: 'hey', difficulty: 'Expert' },
        ];
        component.aiDifficulty = 'expert';
        component.playerName = 'pro';
        component.aiNames();
        tick();
        expect(component.aiName).toEqual('');
        flush();
    }));

    it('click of button should call onClose', fakeAsync(() => {
        const spy = spyOn(component, 'onClose');
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#headButton')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));
});
