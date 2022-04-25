import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Score } from '@common/classes/score';

@Component({
    selector: 'app-best-scores',
    templateUrl: './best-scores.component.html',
    styleUrls: ['./best-scores.component.scss'],
})
export class BestScoresComponent implements OnInit {
    classicScores: Score[];
    log2990Scores: Score[];

    constructor(public socketService: SocketService, public dialogRef: MatDialogRef<BestScoresComponent>) {}

    ngOnInit(): void {
        this.requestScores();
        this.receiveScores();
    }

    requestScores() {
        this.socketService.send('classicScores');
        this.socketService.send('log2990Scores');
    }

    receiveScores() {
        this.socketService.on('classicScoreList', (scoreList: Score[]) => {
            this.classicScores = scoreList.slice(0);
        });
        this.socketService.on('log2990ScoreList', (scoreList: Score[]) => {
            this.log2990Scores = scoreList.slice(0);
        });
    }

    onClose() {
        this.dialogRef.close();
    }
}
