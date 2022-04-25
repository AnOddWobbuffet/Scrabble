import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BestScoresComponent } from '@app/components/best-scores/best-scores.component';
import { ConnectionComponent } from '@app/components/connection/connection.component';
import { CreateRoomComponent } from '@app/components/create-room/create-room.component';
import { JoinRoomComponent } from '@app/components/join-room/join-room.component';
import { ConcedeDialogComponent } from '@app/dialog/concede-dialog/concede-dialog.component';

@Injectable({
    providedIn: 'root',
})
export class DialogService {
    constructor(public dialog: MatDialog) {}

    openConnection() {
        this.dialog.open(ConnectionComponent, {
            panelClass: 'custom-dialog-container',
            width: '75%',
            height: '50%',
            autoFocus: false,
        });
    }

    openGameCreation() {
        this.dialog.open(CreateRoomComponent, {
            panelClass: 'custom-dialog-container',
            width: '75%',
            height: '75%',
            autoFocus: false,
        });
    }

    openJoinGame() {
        this.dialog.open(JoinRoomComponent, {
            panelClass: 'custom-dialog-container',
            width: '75%',
            height: '75%',
            autoFocus: false,
        });
    }

    openBestScores() {
        this.dialog.open(BestScoresComponent, {
            panelClass: 'custom-dialog-container',
            width: '75%',
            height: '75%',
            autoFocus: false,
        });
    }

    openConcede() {
        this.dialog.open(ConcedeDialogComponent, {
            panelClass: 'custom-dialog-container',
            width: '40%',
            height: '25%',
            autoFocus: false,
        });
    }
    close() {
        this.dialog.closeAll();
    }
}
