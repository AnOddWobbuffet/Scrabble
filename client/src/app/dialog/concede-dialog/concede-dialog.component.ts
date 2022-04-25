import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/socket/socket-communication.service';

@Component({
    selector: 'app-concede-dialog',
    templateUrl: './concede-dialog.component.html',
    styleUrls: ['./concede-dialog.component.scss'],
})
export class ConcedeDialogComponent {
    constructor(public socketService: SocketService, private router: Router, public dialogRef: MatDialogRef<ConcedeDialogComponent>) {}

    abandon() {
        this.socketService.send('abandonRequest');
        this.router.navigate(['/classic_mode']);
        this.dialogRef.close();
    }

    onClose() {
        this.dialogRef.close();
    }
}
