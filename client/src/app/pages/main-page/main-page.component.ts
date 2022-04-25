import { Component, OnInit } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { DisconnectService } from '@app/services/disconnect/disconnect.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit {
    constructor(public dialog: DialogService, public communication: CommunicationService, public disconnect: DisconnectService) {}
    ngOnInit() {
        this.disconnect.checkConnection();
    }

    onScores() {
        this.dialog.openBestScores();
    }

    onClick(mode: string) {
        this.communication.mode = mode;
        this.dialog.openConnection();
    }
}
