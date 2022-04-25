import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NameDialogComponent } from './name-dialog.component';

describe('NameDialogComponent', () => {
    let component: NameDialogComponent;
    let fixture: ComponentFixture<NameDialogComponent>;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [NameDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: matDialogSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NameDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('doAction should set the invalidName msg and set the localData formName if form is valid', () => {
        component.formName = 'testName';
        component.allNames = [];
        component.doAction();
        fixture.detectChanges();
        expect(component.invalidName).toEqual('');
        expect(component.localData.formName).toEqual(component.formName);
    });

    it('doAction should set the invalidName msg (not empty) if form is invalid', () => {
        expect(component.invalidName).toEqual('');
        component.allNames = [];
        const name = { name: 'testName', difficulty: 'Novice' };
        component.formName = 'testName';
        component.allNames.push(name);
        component.doAction();
        fixture.detectChanges();
        expect(component.invalidName).toEqual('Le nom existe déjà dans la base de donnée');
    });

    it('closeDialog should close dialog', () => {
        component.closeDialog();
        fixture.detectChanges();
        expect(component.dialogRef.close).toHaveBeenCalled();
    });
});
