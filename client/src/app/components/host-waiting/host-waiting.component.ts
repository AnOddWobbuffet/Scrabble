import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication/communication.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Info } from '@common/classes/info';
import { Constants } from '@common/constants';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-host-waiting',
    templateUrl: './host-waiting.component.html',
    styleUrls: ['./host-waiting.component.scss'],
})
export class HostWaitingComponent implements OnInit {
    waitingList: Info[];

    constructor(
        public socketService: SocketService,
        public router: Router,
        private communicationService: CommunicationService,
        private dialog: DialogService,
        public toastr: ToastrService,
    ) {
        this.waitingList = [];
    }

    ngOnInit() {
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures() {
        this.socketService.on('gameStart', (roomName: string) => {
            this.socketService.send('joinRoom', roomName);
            this.router.navigate(['/game']);
        });
        this.socketService.on('someoneChangedIdea', (guestId: string) => {
            this.waitingList.forEach((waiter, index) => {
                if (guestId === waiter.id) this.waitingList.splice(index, 1);
            });
        });

        this.socketService.on('dictDeleted', () => {
            this.toastr.info('Le dictionnaire sélectionné pour cette partie a été remplacé par celui de défaut', 'Dictionnaire supprimé');
        });
        this.request();
    }

    request() {
        this.socketService.on('joinRequest', (guest: Info) => {
            this.waitingList.push(guest);
        });
    }

    acceptRequest(guest: Info) {
        this.waitingList.forEach((value, index) => {
            if (value === guest) this.waitingList.splice(index, 1);
        });
        this.socketService.send('acceptRequest', guest);
        this.socketService.send('gameStarted', this.waitingList);
        this.communicationService.roomTime = Constants.TIME.TIMER;
    }

    deleteRequest(guest: Info) {
        this.waitingList.splice(this.waitingList.indexOf(guest), 1);
        this.socketService.send('deleteRequest', guest);
    }

    deleteRoom() {
        this.socketService.send('deleteRoom', this.waitingList);
    }

    convertToSolo() {
        this.socketService.send('deleteRoom', this.waitingList);
        this.communicationService.gameMode = 'solo';
        this.dialog.openGameCreation();
    }
}
