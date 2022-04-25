import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { SocketTestHelper } from '@app/classes/socket/socket-test-helper';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Score } from '@common/classes/score';
import { Socket } from 'socket.io-client';
import { BestScoresComponent } from './best-scores.component';

class SocketServiceMock extends SocketService {}

describe('BestScoresComponent', () => {
    let component: BestScoresComponent;
    let fixture: ComponentFixture<BestScoresComponent>;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketServiceMock;
    const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [HttpClientModule, MatDialogModule],
            declarations: [BestScoresComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceMock },
                { provide: MatDialogRef, useValue: matDialogSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BestScoresComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call roomList and receiveRoomList', () => {
        const spyRequest = spyOn(component, 'requestScores');
        const spyReceive = spyOn(component, 'receiveScores');
        component.ngOnInit();
        expect(spyRequest).toHaveBeenCalledTimes(1);
        expect(spyReceive).toHaveBeenCalledTimes(1);
    });

    it('requestScores should send a classicScores event and a log2990Scores event', () => {
        const spy = spyOn(component.socketService, 'send');
        const eventClassicScores = 'classicScores';
        const eventLOG2990Scores = 'log2990Scores';
        component.requestScores();
        expect(spy).toHaveBeenCalledWith(eventClassicScores);
        expect(spy).toHaveBeenCalledWith(eventLOG2990Scores);
    });

    it('should handle classicScoreList and set classicScores + log2990ScoreList and set log2990Scores', () => {
        const scoresClassicTest: Score[] = [{ username: ['classique'], points: 5 }];
        const scoresLogTest: Score[] = [{ username: ['log'], points: 10 }];
        socketHelper.peerSideEmit('classicScoreList', scoresClassicTest);
        socketHelper.peerSideEmit('log2990ScoreList', scoresLogTest);
        expect(component.classicScores).toEqual(scoresClassicTest);
        expect(component.log2990Scores).toEqual(scoresLogTest);
    });

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
});
