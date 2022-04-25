import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { DictionnaryDialogComponent } from '@app/dialog/dictionnary-dialog/dictionnary-dialog.component';
import { NameDialogComponent } from '@app/dialog/name-dialog/name-dialog.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { AdminComponent } from './admin.component';

class SocketServiceMock extends SocketService {}
describe('AdminComponent', () => {
    let component: AdminComponent;
    let fixture: ComponentFixture<AdminComponent>;
    let socketServiceMock: SocketServiceMock;
    let socketHelper: SocketTestHelper;
    let dialog: MatDialog;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [MatDialogModule, ToastrModule.forRoot(), BrowserAnimationsModule],
            declarations: [AdminComponent],
            providers: [{ provide: SocketService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminComponent);
        dialog = TestBed.inject(MatDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call ', () => {
        const spyRequest = spyOn(component, 'requestAll');
        const spyReceive = spyOn(component, 'receiveAll');
        component.ngOnInit();
        expect(spyRequest).toHaveBeenCalledTimes(1);
        expect(spyReceive).toHaveBeenCalledTimes(1);
    });

    it('should handle a matches event and set matches to matchHistory array ', fakeAsync(() => {
        const match = {
            date: new Date(),
            duration: 60,
            playerOneName: 'One',
            playerOnePoints: 1,
            playerTwoName: 'Two',
            playerTwoPoints: 2,
            mode: 'classique',
            abandon: false,
            solo: false,
        };
        socketHelper.peerSideEmit('matches', [match]);
        tick();
        expect(component.matchHistory.length).toEqual(1);
    }));

    it('should send a downloadReceive event when calling downloadRequest ', fakeAsync(() => {
        const spy = spyOn(component.socketService, 'send').and.stub();
        const path = 'randomPath';
        component.downloadRequest(path);
        tick();
        expect(spy).toHaveBeenCalled();
    }));
    it('should handle a downloadReceive event and download the file ', fakeAsync(() => {
        const dict = { title: 'title', description: 'description', words: ['a', 'b', 'c'], path: 'randomPath' };
        const spy = spyOn(JSON, 'stringify');
        const a = document.createElement('a');
        spyOn(document, 'createElement').and.returnValue(a);
        spyOn(a, 'click').and.stub();
        fixture.detectChanges();
        socketHelper.peerSideEmit('downloadReceive', dict);
        tick();
        expect(spy).toHaveBeenCalled();
    }));
    it('should handle a dictionnaries event and set dict to dictionnaries array and send their links to filesURL ', fakeAsync(() => {
        const dict = { title: 'title', description: 'description', words: ['a', 'b', 'c'] };
        socketHelper.peerSideEmit('dictionnaries', [dict]);
        tick();
        expect(component.dictionnaries.length).toEqual(1);
        // expect(component.filesURL.length).toEqual(1);
    }));

    it('should handle a noviceNames event and set names to aiNoviceNames array', fakeAsync(() => {
        const name = { name: 'name', difficulty: 'Novice' };
        socketHelper.peerSideEmit('noviceNames', [name]);
        tick();
        expect(component.aiNoviceNames.length).toEqual(1);
    }));

    it('should handle a expertNames event and set names to aiExpertNames array', fakeAsync(() => {
        const name = { name: 'name', difficulty: 'Expert' };
        socketHelper.peerSideEmit('expertNames', [name]);
        tick();
        expect(component.aiExpertNames.length).toEqual(1);
    }));

    it('convertNumberToTime should convert a number to minutes and seconds', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const msg = component.convertNumberToTime(164);
        expect(msg).toEqual('Durée: ' + '2' + ' minutes' + ' et ' + '44' + ' secondes');
    });

    it('should send a addName event after closing the dialog', () => {
        const spy = spyOn(component.socketService, 'send');
        const name = { name: 'testName', difficulty: 'Novice' };
        spyOn(dialog, 'open').and.returnValue({
            afterClosed: () => of({ event: 'Add', data: { formName: name.name, difficulty: name.difficulty } }),
        } as MatDialogRef<typeof NameDialogComponent>);
        component.openNameDialog('Add', name);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('addName', name);
    });

    it('should send a updateName event after closing the dialog', () => {
        const spy = spyOn(component.socketService, 'send');
        const name = { name: 'testName', difficulty: 'Novice' };
        const expectedData = { formName: 'newName', name: 'testName', difficulty: 'Novice' };
        component.aiNoviceNames.push(name);
        spyOn(dialog, 'open').and.returnValue({
            afterClosed: () => of({ event: 'Update', data: { formName: 'newName', name: name.name, difficulty: name.difficulty } }),
        } as MatDialogRef<typeof NameDialogComponent>);
        component.openNameDialog('Add', name);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('updateName', expectedData);
    });

    it('should send a deleteName event after calling deleteName', () => {
        const spy = spyOn(component.socketService, 'send');
        const name = { name: 'testName', difficulty: 'Novice' };
        component.deleteName(name);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('deleteName', name);
    });

    it('should send a addDict event after closing the dialog', () => {
        const spy = spyOn(component.socketService, 'send');
        const dict = { title: 'title', description: 'description', words: ['a', 'b', 'c'] };
        spyOn(dialog, 'open').and.returnValue({
            afterClosed: () => of({ event: 'Add', data: { formDict: { title: dict.title, description: dict.description, words: dict.words } } }),
        } as MatDialogRef<typeof DictionnaryDialogComponent>);
        component.openDictDialog('Add', dict);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('addDict', dict);
    });

    it('should send a updateDict event after closing the dialog', () => {
        const spy = spyOn(component.socketService, 'send');
        const dict = { title: 'title', description: 'description', words: ['a', 'b', 'c'] };
        const dict2 = { title: 'title2', description: 'description2', words: ['a', 'b', 'c'] };
        const expectedDict = { oldTitle: dict.title, newTitle: 'newTitle', newDesc: 'newDesc', words: ['a', 'b', 'c'] };
        component.dictionnaries.push(dict);
        component.dictionnaries.push(dict2);
        fixture.detectChanges();
        spyOn(dialog, 'open').and.returnValue({
            afterClosed: () =>
                of({
                    event: 'Update',
                    data: { formDict: { title: 'newTitle', description: 'newDesc', words: dict.words }, title: dict.title, words: dict.words },
                }),
        } as MatDialogRef<typeof DictionnaryDialogComponent>);
        component.openDictDialog('Update', dict);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('updateDict', expectedDict);
    });

    it('should send a deleteDict event after calling deleteDict', () => {
        const spy = spyOn(component.socketService, 'send');
        const dictTitle = 'testTitle';
        component.deleteDict(dictTitle);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('deleteDict', dictTitle);
    });

    it('should send a resetPart event after calling reset', () => {
        const spy = spyOn(component.socketService, 'send');
        const part = 'testpart';
        component.reset(part);
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledWith('resetPart', part);
    });
});
