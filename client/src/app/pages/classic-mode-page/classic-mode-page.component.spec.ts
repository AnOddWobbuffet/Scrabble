import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { HostPageComponent } from '@app/pages/host-page/host-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

describe('ClassicPageComponent', () => {
    let component: ClassicModePageComponent;
    let fixture: ComponentFixture<ClassicModePageComponent>;
    // let location: Location;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'home', component: MainPageComponent },
                    { path: 'host', component: HostPageComponent },
                    { path: 'join', component: JoinPageComponent },
                ]),
                MatDialogModule,
                HttpClientTestingModule,
                BrowserAnimationsModule,
            ],
            declarations: [ClassicModePageComponent, MainPageComponent, HostPageComponent, JoinPageComponent],
        }).compileComponents();

        // location = TestBed.inject(Location);
        router = TestBed.inject(Router);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClassicModePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onJoin should close the dialog', fakeAsync(() => {
        component.onJoin();
        tick();
        // expect(component.dialog.openJoinGame).toHaveBeenCalled();
    }));

    it('onBack should send a deleteEverything event and redirect', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const spyNav = spyOn(router, 'navigate');
        const eventName = 'deleteEverything';
        component.onBack();
        expect(spy).toHaveBeenCalledWith(eventName);
        expect(spyNav).toHaveBeenCalled();
    }));

    it('onCreate should set the mode and open dialog', fakeAsync(() => {
        component.onCreate('solo');
        expect(component.communication.gameMode).toEqual('solo');
        // expect(component.dialog.openGameCreation).toHaveBeenCalled();
    }));
});
