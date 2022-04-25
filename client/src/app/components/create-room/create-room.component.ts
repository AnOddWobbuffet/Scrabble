import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Dictionnary } from '@common/classes/dictionnary';
import { Name } from '@common/classes/name';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-create-room',
    templateUrl: './create-room.component.html',
    styleUrls: ['./create-room.component.scss'],
})
export class CreateRoomComponent implements OnInit, OnDestroy {
    lastRoomName: string;
    roomName: string;
    playerName: string;
    aiName: string;
    aiNamesN: Name[];
    aiNamesE: Name[];
    dictionnaries: Dictionnary[];
    selectedDict: Dictionnary;
    roomTime: number;
    errorMessage: string;
    aiDifficulty: string;
    firstTimeOpen: boolean;

    constructor(
        public socketService: SocketService,
        private router: Router,
        public communication: CommunicationService,
        public dialogRef: MatDialogRef<CreateRoomComponent>,
    ) {
        this.lastRoomName = '';
        this.roomName = '';
        this.playerName = '';
        this.aiName = '';
        this.dictionnaries = [];
        this.selectedDict = { title: '', description: '', words: [] };
        this.errorMessage = '';
        this.aiDifficulty = 'novice';
        this.firstTimeOpen = true;
    }

    ngOnInit() {
        this.roomTime = this.communication.roomTime;
        if (this.firstTimeOpen) {
            this.firstTimeOpen = false;
            this.roomName = 'Salle de ' + this.communication.myName;
        }
        this.requestParams();
        this.receiveParams();
        setTimeout(() => {
            if (this.communication.gameMode === 'solo') {
                this.setAIName(this.aiNamesN);
                this.roomName = 'Salle solo de ' + this.communication.myName;
            }
            this.selectedDict = this.dictionnaries[0];
        }, Constants.TIME.MAX_TIME * 2);
        this.creationError();
        this.created();
    }

    ngOnDestroy(): void {
        if (this.socketService.isSocketAlive() && this.socketService.socket.hasListeners('roomCreationConfirmation')) {
            this.socketService.socket.removeListener('roomCreationConfirmation');
        }
    }

    aiNames() {
        if (this.aiDifficulty === 'novice') {
            this.setAIName(this.aiNamesN);
        } else {
            this.setAIName(this.aiNamesE);
        }
    }

    setAIName(array: Name[]) {
        setTimeout(() => {
            this.aiName = array[Math.floor(Math.random() * array.length)].name;
            while (this.playerName === this.aiName) {
                this.aiName = array[Math.floor(Math.random() * array.length)].name;
            }
        }, Constants.TIME.TIMER);
    }

    createRoom() {
        if (this.roomName) {
            const expert = this.aiDifficulty === 'expert' ? true : false;
            const gameInfo = {
                name: this.roomName,
                time: this.roomTime,
                isExpert: expert,
                mode: this.communication.mode,
                dict: this.selectedDict,
            };
            this.socketService.send('addRoom', gameInfo);
            if (this.communication.gameMode === 'solo') this.socketService.send('aiName', this.aiName);
        } else this.errorMessage = 'Le nom de la salle ne peut pas être vide';
    }

    creationError() {
        this.socketService.on('roomCreationError', (errorMessage: string) => {
            this.errorMessage = errorMessage;
        });
    }

    created() {
        this.socketService.on('roomCreationConfirmation', () => {
            this.dialogRef.close();
            if (this.communication.gameMode === 'multijoueur') {
                this.router.navigate(['/hostWaiting']);
            } else if (this.communication.gameMode === 'solo') {
                this.router.navigate(['/game']);
                this.socketService.send('startSoloGame');
                this.communication.roomTime = Constants.TIME.TIMER;
            }
        });
    }

    requestParams() {
        this.socketService.send('playerName');
        this.socketService.send('adminData');
    }

    receiveParams() {
        this.socketService.on('getPlayerName', (name: string) => {
            this.playerName = name;
        });

        this.socketService.on('dictionnaries', (dict: Dictionnary[]) => {
            this.dictionnaries = dict;
        });

        this.socketService.on('noviceNames', (name: Name[]) => {
            this.aiNamesN = name;
        });

        this.socketService.on('expertNames', (name: Name[]) => {
            this.aiNamesE = name;
        });
    }

    reduceTime() {
        if (this.roomTime > Constants.TIME.MIN_TIME) {
            this.roomTime = this.roomTime - Constants.TIME.MIN_TIME;
            this.communication.roomTime = this.roomTime;
        }
    }

    gainTime() {
        if (this.roomTime < Constants.TIME.MAX_TIME) {
            this.roomTime = this.roomTime + Constants.TIME.MIN_TIME;
            this.communication.roomTime = this.roomTime;
        }
    }

    onClose() {
        this.dialogRef.close();
        this.communication.roomTime = Constants.TIME.TIMER;
    }
}
