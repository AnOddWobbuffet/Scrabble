import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketService } from '@app/services/socket/socket-communication.service';

@Component({
    selector: 'app-connection',
    templateUrl: './connection.component.html',
    styleUrls: ['./connection.component.scss'],
})
export class ConnectionComponent implements OnInit {
    username: string;
    errorMessage: string;
    lastUsername: string;

    constructor(
        public socketService: SocketService,
        private router: Router,
        public dialogRef: MatDialogRef<ConnectionComponent>,
        private communication: CommunicationService,
    ) {
        this.username = '';
        this.errorMessage = '';
        this.lastUsername = '';
    }

    ngOnInit() {
        this.usernameCreation();
        if (!this.username) {
            this.errorMessage = '';
        }
    }

    usernameCreation() {
        this.socketService.on('usernameCreationConfirmed', (confirmed: boolean) => {
            if (confirmed) {
                this.dialogRef.close();
                this.router.navigate(['/classic_mode']);
                this.communication.myName = this.username;
            }
        });
        this.socketService.on('usernameCreationError', (errorMessage: string) => {
            this.errorMessage = errorMessage;
        });
    }

    sendUsername() {
        this.lastUsername = this.username;
        if (!this.username) this.errorMessage = "Le nom d'utilisateur ne peut pas être vide";
        else this.socketService.send('addUsername', this.username);
    }

    onClose() {
        this.dialogRef.close();
    }
}
