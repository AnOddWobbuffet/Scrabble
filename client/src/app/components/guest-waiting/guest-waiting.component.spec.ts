/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Socket } from 'socket.io-client';
import { GuestWaitingComponent } from './guest-waiting.component';
import SpyObj = jasmine.SpyObj;

class SocketServiceMock extends SocketService {}

describe('GuestWaitingComponent', () => {
    let component: GuestWaitingComponent;
    let fixture: ComponentFixture<GuestWaitingComponent>;
    let router: Router;
    let location: Location;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('ExampleService', ['basicGet', 'basicPost']);
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'game', component: GamePageComponent },
                    { path: 'join', component: JoinPageComponent },
                ]),
                HttpClientModule,
            ],
            declarations: [GuestWaitingComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuestWaitingComponent);
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

        it('should handle denial event and call handleJoinFailure', fakeAsync(() => {
            const spy = spyOn(component, 'handleJoinFailure');
            const reasonString = 'test';
            socketHelper.peerSideEmit('denial', reasonString);
            tick();
            expect(spy).toHaveBeenCalledWith(reasonString);
        }));

        it('should handle roomDeleted event and call handleJoinFailure', fakeAsync(() => {
            const spy = spyOn(component, 'handleJoinFailure');
            const reasonString = 'test';
            socketHelper.peerSideEmit('roomDeleted', reasonString);
            tick();
            expect(spy).toHaveBeenCalledWith(reasonString);
        }));
    });

    it('should set failMessage and redirect to join page after 10s if reason = gameDisappear', () => {
        const reason = 'gameDisappear';
        const spy = spyOn(router, 'navigate');
        jasmine.clock().install();
        component.handleJoinFailure(reason);
        jasmine.clock().tick(1000);
        expect(component.failMessage).toEqual("La partie n'existe plus");
        expect(spy).not.toHaveBeenCalledOnceWith(['/classic_mode']);
        jasmine.clock().tick(9000);
        expect(spy).toHaveBeenCalledOnceWith(['/classic_mode']);
        jasmine.clock().uninstall();
    });

    it('should set failMessage and redirect to join page after 10s if reason = hostKick', () => {
        const reason = 'hostKick';
        const spy = spyOn(router, 'navigate');
        jasmine.clock().install();
        component.handleJoinFailure(reason);
        jasmine.clock().tick(1000);
        expect(component.failMessage).toEqual("L'hôte vous a retiré de la partie.");
        expect(spy).not.toHaveBeenCalledOnceWith(['/classic_mode']);
        jasmine.clock().tick(9000);
        expect(spy).toHaveBeenCalledOnceWith(['/classic_mode']);
        jasmine.clock().uninstall();
    });

    it('should set failMessage and redirect to join page after 10s if reason = noBodyWantsToPlayWithYou', () => {
        const reason = 'noBodyWantsToPlayWithYou';
        const spy = spyOn(router, 'navigate');
        jasmine.clock().install();
        component.handleJoinFailure(reason);
        jasmine.clock().tick(1000);
        expect(component.failMessage).toEqual('La partie a commencée sans toi :(');
        expect(spy).not.toHaveBeenCalledOnceWith(['/classic_mode']);
        jasmine.clock().tick(9000);
        expect(spy).toHaveBeenCalledOnceWith(['/classic_mode']);
        jasmine.clock().uninstall();
    });

    it('click of button should call quit', fakeAsync(() => {
        const spy = spyOn(component, 'quit');
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#quit')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('should send a changeIdea event', () => {
        const spy = spyOn(component.socketService, 'send');
        const spyNav = spyOn(router, 'navigate');
        const eventName = 'changeIdea';
        component.quit();
        expect(spy).toHaveBeenCalledWith(eventName, communicationServiceSpy.hostInfo);
        expect(spyNav).toHaveBeenCalledOnceWith(['/classic_mode']);
    });
});
