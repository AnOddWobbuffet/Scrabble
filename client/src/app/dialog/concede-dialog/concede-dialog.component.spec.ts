import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { ConcedeDialogComponent } from './concede-dialog.component';

describe('ConcedeDialogComponent', () => {
    let component: ConcedeDialogComponent;
    let fixture: ComponentFixture<ConcedeDialogComponent>;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([{ path: 'classic_mode', component: ClassicModePageComponent }])],
            declarations: [ConcedeDialogComponent],
            providers: [{ provide: MatDialogRef, useValue: matDialogSpy }],
        }).compileComponents();

        router = TestBed.inject(Router);
        router.initialNavigation();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConcedeDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('click of button should call onClose', fakeAsync(() => {
        const spy = spyOn(component, 'onClose');
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#refuse')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('click of button should call abandon', fakeAsync(() => {
        const spy = spyOn(component, 'abandon');
        fixture.detectChanges();
        fixture.debugElement.query(By.css('#accept')).nativeElement.click();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('abandon should send a abandonRequest event and redirect', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send');
        const spyNav = spyOn(router, 'navigate');
        const eventName = 'abandonRequest';
        component.abandon();
        expect(spy).toHaveBeenCalledWith(eventName);
        expect(spyNav).toHaveBeenCalled();
    }));
});
