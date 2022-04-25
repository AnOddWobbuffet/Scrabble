import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-error-page',
    templateUrl: './error-page.component.html',
    styleUrls: ['./error-page.component.scss'],
})
export class ErrorPageComponent implements OnInit {
    constructor(public socketService: SocketService, private router: Router) {}

    ngOnInit() {
        this.connect();
    }

    connect() {
        const interval = setInterval(() => {
            if (this.socketService.isSocketAlive()) {
                this.router.navigate(['/home']);
                clearInterval(interval);
            }
        }, Constants.TIME.DISCONNECT_INTERVAL);
    }
}
