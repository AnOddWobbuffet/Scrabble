import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Info } from '@common/classes/info';
import { Rack } from '@common/classes/rack';
import { Socket } from 'socket.io-client';
import { JoinRoomComponent } from './join-room.component';
import SpyObj = jasmine.SpyObj;

class SocketServiceMock extends SocketService {}

describe('JoinRoomComponent', () => {
    let component: JoinRoomComponent;
    let fixture: ComponentFixture<JoinRoomComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let infoList: Info[];
    let info1: Info;
    let info2: Info;
    let info3: Info;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('ExampleService', ['basicGet', 'basicPost']);
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        info1 = {
            id: 'testID',
            name: 'testName',
            room: 'testRoom',
            time: 60,
            rack: new Rack(),
            points: 1,
            mode: 'classique',
        };
        info2 = {
            id: 'testID2',
            name: 'testName2',
            room: 'testRoom2',
            time: 60,
            rack: new Rack(),
            points: 2,
            mode: 'classique',
        };
        info3 = {
            id: 'testID3',
            name: 'testName3',
            room: 'testRoom3',
            rack: new Rack(),
            points: 3,
            time: NaN,
            mode: 'LOG2990',
        };
        infoList = [info1, info2, info3];
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [HttpClientModule],
            declarations: [JoinRoomComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: MatDialogRef, useValue: matDialogSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call roomList and receiveRoomList', () => {
        const spyRequest = spyOn(component, 'requestRoomList');
        const spyReceive = spyOn(component, 'receiveRoomList');
        component.ngOnInit();
        expect(spyRequest).toHaveBeenCalledTimes(1);
        expect(spyReceive).toHaveBeenCalledTimes(1);
    });

    it('should send a roomList event', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'roomList';
        component.requestRoomList();
        expect(spy).toHaveBeenCalledWith(eventName);
    });

    it('click of button should call joinRoom', fakeAsync(() => {
        const spy = spyOn(component, 'joinRoom');
        infoList.forEach((info) => {
            component.roomList.push(info);
        });
        communicationServiceSpy.mode = 'classique';
        fixture.detectChanges();
        fixture.debugElement.query(By.css('.joinButton')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalled();
    }));

    it('should send a requestJoinRoom event when calling joinRoom', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'requestJoinRoom';
        component.joinRoom(info1);
        expect(spy).toHaveBeenCalledWith(eventName, info1);
        expect(communicationServiceSpy.hostInfo).toEqual(info1);
    });

    it('should send a requestJoinRoom event when calling joinRandomRoom', () => {
        const spy = spyOn(component.socketService, 'send');
        component.roomList = infoList;
        component.joinRandomRoom(infoList);
        expect(spy).toHaveBeenCalled();
    });

    it('should handle roomListMessage event and set roomList', () => {
        socketHelper.peerSideEmit('roomListMessage', infoList);
        expect(component.roomList.length).toBe(3);
        expect(component.roomList).toEqual(infoList);
    });

    it('splitList should separate roomList into mode list', () => {
        component.roomList = infoList;
        component.splitList();
        expect(component.classicList.length).toEqual(2);
        expect(component.log2990List.length).toEqual(1);
    });

    it('click of button should call onClose', fakeAsync(() => {
        const spy = spyOn(component, 'onClose');
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#headButton')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));
});
