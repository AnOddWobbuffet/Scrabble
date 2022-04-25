import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication/communication.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
@Component({
    selector: 'app-classic-mode-page',
    templateUrl: './classic-mode-page.component.html',
    styleUrls: ['./classic-mode-page.component.scss'],
})
export class ClassicModePageComponent {
    constructor(
        public socketService: SocketService,
        private route: Router,
        public dialog: DialogService,
        public communication: CommunicationService,
    ) {}

    onBack() {
        this.socketService.send('deleteEverything');
        this.route.navigate(['/home']);
    }

    onCreate(gameMode: string) {
        this.communication.gameMode = gameMode;
        this.dialog.openGameCreation();
    }

    onJoin() {
        this.dialog.openJoinGame();
    }
}
