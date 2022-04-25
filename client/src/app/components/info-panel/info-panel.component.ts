import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Info } from '@app/classes/info/info';
import { Panel } from '@app/classes/panel/panel';
import { CommunicationService } from '@app/services/communication/communication.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Rack } from '@common/classes/rack';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-info-panel',
    templateUrl: './info-panel.component.html',
    styleUrls: ['./info-panel.component.scss'],
})
export class InfoPanelComponent implements OnInit, OnDestroy {
    timeLeft: number;
    name: string;
    opponentName: string;
    currentPlayer: string;
    roomName: string;
    points: number;
    opponentPoints: number;
    isGameOver: boolean;
    remainingLetters: number;
    currentLetters: number;
    showRackLetters: boolean;
    winner: string;
    abandonRequest: boolean;
    abandonConfirmed: boolean;
    privateObjective: string;
    privateObjectivePoints: number;
    publicObjectives: string[];
    publicObjectivesPoints: number[];
    completedObjectives: string[];
    opponentLetters: number;

    constructor(
        public socketService: SocketService,
        public turnService: TurnService,
        private router: Router,
        public communication: CommunicationService,
        public dialogService: DialogService,
    ) {
        this.isGameOver = false;
        this.opponentPoints = 0;
        this.points = 0;
        this.showRackLetters = false;
        this.abandonRequest = true;
        this.abandonConfirmed = false;
        this.privateObjective = '';
        this.privateObjectivePoints = 0;
        this.publicObjectives = [];
        this.publicObjectivesPoints = [];
        this.completedObjectives = [];
    }

    ngOnInit() {
        this.configureBaseSocketFeatures();
    }

    ngOnDestroy(): void {
        if (this.socketService.isSocketAlive() && this.socketService.socket.hasListeners('getPanelInfo')) {
            this.socketService.socket.removeAllListeners();
        }
    }

    configureBaseSocketFeatures() {
        this.socketService.on('userInfo', (info: Info) => {
            this.name = info.name;
        });

        this.socketService.on('opponentInfo', (info: Info) => {
            this.opponentName = info.name;
        });

        this.socketService.on('getPanelInfo', (panel: Panel) => {
            this.timeLeft = panel.time;
            this.currentPlayer = panel.playerTurnName;
            this.remainingLetters = panel.remainingLetters;
        });

        this.socketService.on('updatePoints', (points: number) => {
            this.points = points;
        });

        this.socketService.on('updateOpponentPoints', (points: number) => {
            this.opponentPoints = points;
        });

        this.socketService.on('wordPlayed', () => {
            this.socketService.send('playerTurnEnd', false);
        });

        this.socketService.on('gameOver', (winner: string) => {
            this.isGameOver = true;
            this.winner = winner;
            this.abandonConfirmed = true;
        });

        this.socketService.on('updateRack', (rack: Rack) => {
            this.currentLetters = 0;
            for (const tile of rack.rack) {
                if (tile.letter !== '-') this.currentLetters++;
            }
            this.showRackLetters = this.currentLetters === Constants.RACK_LENGTH ? false : true;
        });

        this.socketService.on('privateObjective', (objective: string) => {
            this.privateObjective = objective;
            this.privateObjectivePoints = Constants.OBJECTIVES_LIST.get(objective) as number;
        });

        this.socketService.on('publicObjective', (objective: string) => {
            this.publicObjectives.push(objective);
            this.publicObjectivesPoints.push(Constants.OBJECTIVES_LIST.get(objective) as number);
        });

        this.socketService.on('removeObjective', (objective: string) => {
            this.completedObjectives.push(objective);
            if (this.privateObjective === objective) {
                this.privateObjective = '';
            } else {
                this.publicObjectives.splice(this.publicObjectives.indexOf(objective), 1);
            }
        });

        this.socketService.on('opponentObjective', (objective: string) => {
            this.completedObjectives.push(objective);
        });

        this.socketService.on('opponentLetters', (letters: number) => {
            this.opponentLetters = letters;
        });
    }

    abandon() {
        this.dialogService.openConcede();
    }

    returnToMenu() {
        this.socketService.send('removeRoom');
        this.router.navigate(['/classic_mode']);
    }
}
