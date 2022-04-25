import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Constants } from '@common/constants';

@Injectable({
    providedIn: 'root',
})
export class DisconnectService {
    constructor(private router: Router, private dialogService: DialogService, private socketService: SocketService) {
        this.checkConnection();
    }
    checkConnection() {
        setInterval(() => {
            if (!this.socketService.isSocketAlive()) {
                this.router.navigate(['/error']);
                this.dialogService.close();
            }
        }, Constants.TIME.DISCONNECT_INTERVAL);
    }
}
