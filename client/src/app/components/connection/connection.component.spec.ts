import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { ConnectionComponent } from '@app/components/connection/connection.component';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Socket } from 'socket.io-client';

class SocketServiceMock extends SocketService {}

describe('ConnectionComponent', () => {
    let component: ConnectionComponent;
    let fixture: ComponentFixture<ConnectionComponent>;
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
            imports: [RouterTestingModule.withRoutes([{ path: 'classic_mode', component: ClassicModePageComponent }]), HttpClientTestingModule],
            declarations: [ConnectionComponent, ClassicModePageComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: MatDialogRef, useValue: matDialogSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call usernameCreation', () => {
        const spyComponent = spyOn(component, 'usernameCreation');
        component.ngOnInit();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    });

    describe('Receiving events', () => {
        it('should redirect to classic-mode-page', fakeAsync(() => {
            const boolTest = true;
            socketHelper.peerSideEmit('usernameCreationConfirmed', boolTest);
            tick();
            expect(location.path()).toEqual('/classic_mode');
        }));

        it('should not redirect to classic-mode-page if bool is false', fakeAsync(() => {
            const boolTest = false;
            socketHelper.peerSideEmit('usernameCreationConfirmed', boolTest);
            tick();
            expect(location.path()).not.toEqual('/classic_mode');
        }));

        it('should handle usernameCreationError and set errorMessage', () => {
            const errorTest = 'fail';
            socketHelper.peerSideEmit('usernameCreationError', errorTest);
            expect(component.errorMessage).toEqual(errorTest);
        });
    });

    it('click of button should call sendUsername', fakeAsync(() => {
        const spy = spyOn(component, 'sendUsername');
        component.username = 'testName';
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#button')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('click of button should call onClose', fakeAsync(() => {
        const spy = spyOn(component, 'onClose');
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#headButton')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('onClose should close the dialog', fakeAsync(() => {
        component.onClose();
        tick();
        expect(component.dialogRef.close).toHaveBeenCalled();
    }));

    it('click of button should not call sendUsername if the username input is empty', fakeAsync(() => {
        const spy = spyOn(component, 'sendUsername');
        fixture.debugElement.query(By.css('#button')).nativeElement.click();
        tick();
        expect(spy).not.toHaveBeenCalled();
    }));

    it('should call sendUsername when pressing the enter key', fakeAsync(() => {
        const spyComponent = spyOn(component, 'sendUsername');
        const input = fixture.debugElement.query(By.css('#inputField'));
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
        });
        input.nativeElement.dispatchEvent(event);
        tick();
        expect(spyComponent).toHaveBeenCalledTimes(1);
    }));

    it('should send a addUsername event', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventName = 'addUsername';
        const testUsername = 'test';
        component.username = testUsername;
        component.sendUsername();
        expect(spy).toHaveBeenCalledWith(eventName, testUsername);
    });
});
