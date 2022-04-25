import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ConnectionPageComponent } from '@app/pages/connection-page/connection-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let dialogServiceSpy: SpyObj<DialogService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('ExampleService', ['basicGet', 'basicPost']);
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: '' }));
        communicationServiceSpy.basicPost.and.returnValue(of());

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([{ path: 'connect', component: ConnectionPageComponent }]), HttpClientModule, MatDialogModule],
            declarations: [MainPageComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: DialogService, useValue: dialogServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('onScores should open the dialog', fakeAsync(() => {
    //     component.onScores();
    //     tick();
    //     // expect(component.dialog.openBestScores).toHaveBeenCalled();
    // }));

    it('clicking the - button should call the onClick', () => {
        const spy = spyOn(component, 'onClick');
        const button = fixture.debugElement.query(By.css('#classic'));
        button.triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
