/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DictionnaryDialogComponent } from './dictionnary-dialog.component';

describe('DictionnaryDialogComponent', () => {
    let component: DictionnaryDialogComponent;
    let fixture: ComponentFixture<DictionnaryDialogComponent>;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    // const mockReader: FileReader = jasmine.createSpyObj('FileReader', ['onload']);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [DictionnaryDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: matDialogSpy },
                { provide: MAT_DIALOG_DATA, useValue: { action: 'Update' } },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DictionnaryDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('doAction should set localData formDict and invalidDict should be empty if form is valid', () => {
        const dict = { title: 'title', description: 'description' };
        component.allDicts = [dict];
        component.formTitle = 'testTitle';
        component.formDesc = 'testDesc';
        component.formWords = ['a', 'b', 'c'];
        const dictExpect = { title: component.formTitle as string, description: component.formDesc as string, words: component.formWords };
        component.doAction();
        fixture.detectChanges();
        expect(component.localData.formDict).toEqual(dictExpect);
        expect(component.invalidDict.length).toEqual(0);
    });

    it('doAction should set invalidDict (not empty) if form is invalid', () => {
        expect(component.invalidDict.length).toEqual(0);
        const dict = { title: 'title', description: 'description' };
        component.allDicts = [dict];
        component.formTitle = '';
        component.formWords = [];
        component.doAction();
        fixture.detectChanges();
        expect(component.invalidDict.length).toEqual(3);
        component.formTitle = 'title';
        component.formWords = ['a1', 'b^', 'c e'];
        component.doAction();
        fixture.detectChanges();
        expect(component.invalidDict.length).toEqual(3);
        const dictTwo = { title: 'title', description: 'description', path: 'randomPath' };
        component.formDict = { ...dictTwo };
        component.doAction();
        fixture.detectChanges();
        expect(component.invalidDict.length).toEqual(1);
    });
    it('closeDialog should close dialog', () => {
        component.closeDialog();
        fixture.detectChanges();
        expect(component.dialogRef.close).toHaveBeenCalled();
    });

    it('uploadFile should call onload from fileReader', () => {
        // const spy = spyOn(component, 'processFileResult');
        const mockFile = new File([''], 'filename', { type: 'application/json' });
        const mockEvt = { target: { files: [mockFile] } };
        const mockReader: FileReader = jasmine.createSpyObj('FileReader', ['onload', 'readAsText']);
        spyOn(window as any, 'FileReader').and.returnValue(mockReader);
        component.uploadFile(mockEvt as any);
        fixture.detectChanges();
        expect(window.FileReader).toHaveBeenCalled();
        // expect(spy).toHaveBeenCalled();
    });

    it('should call parse from JSON when calling processFileResult', () => {
        const spy = spyOn(JSON, 'parse').and.callThrough();
        const fileTest = { title: 'title', description: 'description', words: ['a', 'b', 'c'] };
        component.processFileResult(JSON.stringify(fileTest));
        expect(spy).toHaveBeenCalledTimes(4);
    });
});
