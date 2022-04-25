import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Socket } from 'socket.io-client';
// eslint-disable-next-line no-restricted-imports
import { MainPageComponent } from '../main-page/main-page.component';
import { ErrorPageComponent } from './error-page.component';
class SocketServiceMock extends SocketService {}
describe('ErrorPageComponent', () => {
    let component: ErrorPageComponent;
    let fixture: ComponentFixture<ErrorPageComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let router: Router;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([{ path: 'home', component: MainPageComponent }])],
            declarations: [ErrorPageComponent],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();

        router = TestBed.inject(Router);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create', () => {
        socketServiceMock.socket.connected = true;
        const spy = spyOn(router, 'navigate');
        jasmine.clock().install();
        component.connect();
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        jasmine.clock().tick(10000);
        expect(spy).toHaveBeenCalledOnceWith(['/home']);
        jasmine.clock().uninstall();
    });
});
