import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-guest-waiting',
    templateUrl: './guest-waiting.component.html',
    styleUrls: ['./guest-waiting.component.scss'],
})
export class GuestWaitingComponent implements OnInit {
    failMessage: string;
    roomName: string;

    constructor(public socketService: SocketService, private router: Router, private communicationService: CommunicationService) {
        this.failMessage = '';
        this.roomName = '';
    }

    ngOnInit() {
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures() {
        this.socketService.on('gameStart', (roomName: string) => {
            this.socketService.send('joinRoom', roomName);
            this.router.navigate(['/game']);
        });
        this.socketService.on('denial', (reason: string) => {
            this.handleJoinFailure(reason);
        });
        this.socketService.on('roomDeleted', (reason: string) => {
            this.handleJoinFailure(reason);
        });
    }

    handleJoinFailure(reason: string) {
        this.failMessage =
            reason === 'gameDisappear'
                ? "La partie n'existe plus"
                : reason === 'hostKick'
                ? "L'hôte vous a retiré de la partie."
                : 'La partie a commencée sans toi :(';

        setTimeout(() => {
            this.router.navigate(['/classic_mode']);
        }, Constants.TIME.WAIT_TIME);
    }

    quit() {
        this.socketService.send('changeIdea', this.communicationService.hostInfo);
        this.router.navigate(['/classic_mode']);
    }
}
