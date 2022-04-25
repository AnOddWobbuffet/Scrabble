import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Message } from '@common/classes/message';
import { Socket } from 'socket.io-client';
import { ChatComponent } from './chat.component';

class SocketServiceMock extends SocketService {}

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [ChatComponent],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the id of the socket', () => {
        socketServiceMock.socket.id = '123';
        const socketId = component.socketId;
        expect(socketId).toEqual('123');
    });

    it('should return an empty string if socket is not defined', () => {
        socketServiceMock.socket.id = '';
        const socketId = component.socketId;
        expect(socketId).toEqual('');
    });

    it('ngOnInit should call configureBaseSocketFeatures', () => {
        const spyComponent = spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    });

    it('should call sendMessage when clicking the button', fakeAsync(() => {
        const spyComponent = spyOn(component, 'sendMessage');
        fixture.debugElement.query(By.css('#chatSubmitButton')).nativeElement.click();
        tick();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    }));

    it('should call sendMessage when pressing the enter key', fakeAsync(() => {
        const spyComponent = spyOn(component, 'sendMessage');
        const input = fixture.debugElement.query(By.css('#chatInputField'));
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
        });
        input.nativeElement.dispatchEvent(event);
        tick();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    }));

    it('should send the message to the server and reset message with a roomMessage event', () => {
        const spyComponent = spyOn(component.socketService, 'send');
        const eventName = 'roomMessage';
        const testMessage = 'test';
        component.message = testMessage;
        component.sendMessage();
        expect(spyComponent).toHaveBeenCalledWith(eventName, testMessage);
        expect(component.message).toEqual('');
    });

    it('should not send a roomMessage event if message is empty', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'roomMessage';
        const testMessage = '';
        component.message = testMessage;
        component.sendMessage();
        expect(spy).not.toHaveBeenCalledWith(eventName, testMessage);
    });

    describe('Receiving events', () => {
        it('should add a message to serverMessages', () => {
            const testMessage: Message = {
                title: 'name',
                body: 'message',
            };
            socketHelper.peerSideEmit('roomMessage', testMessage);
            expect(component.serverMessages.length).toEqual(1);
            expect(component.serverMessages).toContain(testMessage);
        });

        it('should add messages to serverMessages', () => {
            const testMessages: Message[] = [
                {
                    title: 'name1',
                    body: 'message1',
                },
                {
                    title: 'name2',
                    body: 'message2',
                },
                {
                    title: 'name3',
                    body: 'message3',
                },
            ];
            testMessages.forEach((message) => socketHelper.peerSideEmit('roomMessage', message));
            expect(component.serverMessages.length).toEqual(3);
            expect(component.serverMessages).toEqual(testMessages);
        });
    });
});
