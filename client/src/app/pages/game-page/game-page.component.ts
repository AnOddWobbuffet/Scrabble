import { AfterViewInit, Component, HostListener, Input, ViewChild } from '@angular/core';
import { BoardComponent } from '@app/components/board/board.component';
import { InfoPanelComponent } from '@app/components/info-panel/info-panel.component';
import { RackComponent } from '@app/components/rack/rack.component';
import { ResizerService } from '@app/services/resizer/resizer.service';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements AfterViewInit {
    @Input()
    infoPanel: InfoPanelComponent;
    @ViewChild(BoardComponent, { static: true }) board: BoardComponent;
    @ViewChild(RackComponent, { static: true }) rack: RackComponent;
    size: number;
    windowSize: number;
    rackClicked: boolean;
    boardClicked: boolean;

    constructor(public resizerService: ResizerService) {
        this.rackClicked = false;
        this.boardClicked = false;
    }

    @HostListener('document:click', [])
    clickDetect() {
        if (!this.rack.isActive()) {
            this.rack.draw();
            this.rack.manipulationHighlighted = NaN;
            this.rack.exchangeHighlighted.clear();
            if (!this.board.isActive()) this.board.cancelWord();
        }
    }

    @HostListener('window:resize', ['$event'])
    sizer() {
        this.windowSize = Math.min(window.innerHeight, innerWidth) / Constants.RESIZER.WINDOW_DIVIDER;
        this.resizerService.factor = this.windowSize / Constants.RESIZER.WINDOW_FACTOR;
        this.size = this.resizerService.getSize();
        this.board.resizeLetters(this.size);
        this.rack.resizeLetters(this.size);
    }

    rackClick() {
        if (this.boardClicked) {
            this.rackClicked = true;
            this.boardClicked = false;
        }
    }

    boardClick() {
        this.rackClicked = false;
        this.boardClicked = true;
    }

    ngAfterViewInit() {
        this.sizer();
    }

    increment(isIncrement: boolean) {
        if (isIncrement) this.resizerService.increment();
        else this.resizerService.decrement();
        this.size = this.resizerService.getSize();
        this.board.resizeLetters(this.size);
        this.rack.resizeLetters(this.size);
    }
}
