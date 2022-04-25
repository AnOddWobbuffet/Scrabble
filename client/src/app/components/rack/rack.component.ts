import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Info } from '@app/classes/info/info';
import { Panel } from '@app/classes/panel/panel';
import { Tile } from '@app/classes/tile/tile';
import { BoardComponent } from '@app/components/board/board.component';
import { ResizerService } from '@app/services/resizer/resizer.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Rack } from '@common/classes/rack';
import { Vec2 } from '@common/classes/vec2';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-rack',
    templateUrl: './rack.component.html',
    styleUrls: ['./rack.component.scss'],
})
export class RackComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() boardComp: BoardComponent;
    @ViewChild('rackCanvas') rackCanvas: ElementRef<HTMLCanvasElement>;
    context: CanvasRenderingContext2D;
    rack: Rack;
    letterFont: number;
    pointsFont: number;
    buttonPressed: string;
    manipulationHighlighted: number;
    exchangeHighlighted: Map<number, string>;
    mousePosition: Vec2;
    name: string;
    currentPlayer: string;
    remainingLetters: number;
    isDisabled: boolean;
    size: number;
    tileSize: number;

    constructor(
        public socketService: SocketService,
        public turnService: TurnService,
        public resizerService: ResizerService,
        private cd: ChangeDetectorRef,
    ) {
        this.rack = new Rack();
        this.buttonPressed = '';
        this.manipulationHighlighted = NaN;
        this.exchangeHighlighted = new Map([]);
        this.mousePosition = { x: 0, y: 0 };
        this.isDisabled = true;
        this.tileSize = Constants.CANVAS.TILE_SIZE;
    }

    // Detection part
    @HostListener('mousewheel', ['$event'])
    wheelDetect(event: WheelEvent) {
        if (event.deltaY > 0) {
            this.swapManipulation(Constants.DIRECTION.RIGHT);
        } else if (event.deltaY < 0) {
            this.swapManipulation(Constants.DIRECTION.LEFT);
        }
    }

    @HostListener('document:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        if (this.isActive()) this.keyPressed(event);
    }

    @HostListener('window:resize', ['$event'])
    sizer() {
        this.size = Math.min(window.innerHeight, innerWidth) / Constants.RESIZER.WINDOW_DIVIDER;
        this.tileSize = this.size / Constants.BOARD.BOARD_LENGTH;
        this.draw(true);
    }

    keyPressed(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            this.swapManipulation(Constants.DIRECTION.LEFT);
        } else if (event.key === 'ArrowRight') {
            this.swapManipulation(Constants.DIRECTION.RIGHT);
        } else if (this.rack.playerHasLetters(`${event.key}`)) {
            this.findLetterInRackManipulation(`${event.key}`);
        } else {
            this.manipulationHighlighted = NaN;
            this.selectManipulation();
        }
    }

    mouseDetect(event: MouseEvent) {
        event.preventDefault();
        this.boardComp.cancelWord();
        switch (event.button) {
            case 0: {
                this.exchangeHighlighted.clear();
                this.mousePosition = { x: event.offsetX, y: event.offsetY };
                this.manipulationHighlighted = Math.ceil(this.mousePosition.x / this.tileSize) - 1;
                this.selectManipulation();
                break;
            }
            case 2: {
                this.manipulationHighlighted = NaN;
                this.mousePosition = { x: event.offsetX, y: event.offsetY };
                const index = Math.ceil(this.mousePosition.x / this.tileSize) - 1;
                if (this.exchangeHighlighted.has(index)) {
                    this.exchangeHighlighted.delete(index);
                } else {
                    this.exchangeHighlighted.set(index, this.rack.rack[index].letter);
                }
                this.drawExchange();
                break;
            }
        }
    }

    // Server part
    ngAfterViewInit() {
        this.context = (this.rackCanvas.nativeElement as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.requestInitialLetters();
        this.resizeLetters(this.resizerService.getSize());
        this.sizer();
        this.cd.detectChanges();
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
        this.socketService.socket.on('distributeInitialLetters', (receivedLetters: Tile[]) => {
            this.rack.rack = receivedLetters;
            this.draw();
        });
        this.socketService.on('updateRack', (rack: Rack) => {
            this.rack.rack = rack.rack;
            this.draw();
            this.socketService.send('playerTurnEnd', false);
        });
        this.socketService.on('requestRackLetters', () => {
            this.socketService.send('sendRackLetters', this.rack);
        });
        this.socketService.on('turnValidation', () => {
            this.socketService.send('sendTurnValidation', this.turnService.getCanMove());
        });
        this.socketService.on('userInfo', (info: Info) => {
            this.name = info.name;
        });
        this.socketService.on('getPanelInfo', (panel: Panel) => {
            this.remainingLetters = panel.remainingLetters;
        });
        this.socketService.on('gameOver', () => {
            this.isDisabled = true;
        });
        this.socketService.on('currentPlayerTurn', (userInfo: Info) => {
            this.isDisabled = userInfo.name === this.name ? false : true;
        });
    }

    // Draw part
    draw(isResize: boolean = false) {
        this.rackCanvas.nativeElement.width = this.tileSize * Constants.RACK_LENGTH;
        this.rackCanvas.nativeElement.height = this.tileSize;
        this.context.textBaseline = 'middle';
        this.context.textAlign = 'center';
        this.context.fillStyle = '#000000';
        for (let i = 0; i < this.rack.rack.length; i++) {
            const x = i * this.tileSize;
            this.context.beginPath();
            this.drawLetter(this.rack.rack[i], x, 'nothing', isResize);
        }
    }

    drawLetter(tile: Tile, pos: number, select: string, isResize: boolean) {
        if (tile.letter !== '-') {
            this.context.rect(pos, 0, this.tileSize, this.tileSize);
            if (select === 'manipulation' || isResize) {
                if (this.manipulationHighlighted === pos / this.tileSize) {
                    this.context.fillStyle = '#91ED61';
                    isResize = false;
                } else this.context.fillStyle = '#FFFFFF';
                this.context.fillRect(pos, 0, this.tileSize, this.tileSize);
            }
            if (select === 'exchange' || isResize) {
                if (this.exchangeHighlighted.has(pos / this.tileSize)) this.context.fillStyle = '#EA6853';
                else this.context.fillStyle = '#FFFFFF';
                this.context.fillRect(pos, 0, this.tileSize, this.tileSize);
            }
            this.context.fillStyle = Constants.CANVAS.BLACK;
            this.context.font = this.letterFont + Constants.CANVAS.FONT_STYLE;
            this.context.fillText(tile.letter, pos + this.tileSize / 2, this.tileSize / 2);
            this.context.font = this.pointsFont + Constants.CANVAS.FONT_STYLE;
            this.context.fillText(
                tile.points.toString(),
                pos + (this.tileSize / 2) * Constants.CANVAS.SPACING_FACTOR,
                (this.tileSize / 2) * Constants.CANVAS.SPACING_FACTOR,
            );
        }
        this.context.rect(pos, 0, this.tileSize, this.tileSize);
        this.context.stroke();
    }

    // Exchange part
    drawExchange() {
        for (let i = 0; i < Constants.RACK_LENGTH; i++) {
            const position = i * this.tileSize;
            this.drawLetter(this.rack.rack[i], position, 'exchange', false);
        }
    }

    sendExchange(letterMap: Map<number, string>) {
        const letters = Array.from(letterMap.values());
        let letterString = letters.toString();
        letterString = letterString.replace(/,/g, '').toLowerCase();
        this.socketService.send('exchange', letterString);
        this.cancelExchange(letterMap);
    }

    cancelExchange(letterMap: Map<number, string>) {
        letterMap.clear();
        this.drawExchange();
    }

    // Manipulation part
    swapManipulation(direction: number) {
        const position = this.manipulationHighlighted;
        this.manipulationHighlighted += direction;
        this.manipulationHighlighted = ((this.manipulationHighlighted % Constants.RACK_LENGTH) + Constants.RACK_LENGTH) % Constants.RACK_LENGTH;
        this.exchangeManipulation(position, this.manipulationHighlighted);
        this.selectManipulation();
        this.socketService.send('rackSwap', this.rack.getRackLetters());
    }

    exchangeManipulation(position: number, target: number) {
        const letter = this.rack.rack[position].letter;
        const targetLetter = this.rack.rack[target].letter;
        this.rack.rack[position] = new Tile(targetLetter);
        this.rack.rack[target] = new Tile(letter);
    }

    selectManipulation() {
        const x = this.manipulationHighlighted * this.tileSize;
        this.draw();
        this.drawLetter(this.rack.rack[this.manipulationHighlighted], x, 'manipulation', false);
    }

    findLetterInRackManipulation(letter: string) {
        if (isNaN(this.manipulationHighlighted) || this.rack.rack[this.manipulationHighlighted].letter.toLowerCase() !== letter) {
            this.findInRack(0, letter);
        } else {
            this.findInRack(this.manipulationHighlighted + 1, letter);
        }
    }

    findInRack(startingPoint: number, letter: string) {
        for (let i = startingPoint; i < Constants.RACK_LENGTH + startingPoint; i++) {
            i %= Constants.RACK_LENGTH;
            if (this.rack.rack[i].letter.toLowerCase() === letter) {
                this.manipulationHighlighted = i;
                this.selectManipulation();
                break;
            }
        }
    }
    // Basics
    resizeLetters(newSize: number) {
        this.letterFont = newSize;
        this.pointsFont = newSize / 2;
        this.draw();
    }

    requestInitialLetters() {
        this.socketService.send('requestInitialLetters');
    }

    addLetter(letter: string) {
        for (let i = 0; i < this.rack.rack.length; i++) {
            if (this.rack.rack[i].letter === '-') {
                this.rack.rack[i] = new Tile(letter.toUpperCase());
                break;
            }
        }
    }

    removeLetter(letter: string) {
        for (let i = 0; i < this.rack.rack.length; i++) {
            if (this.rack.rack[i].letter === letter.toUpperCase()) {
                this.rack.rack[i] = new Tile('-');
                break;
            }
        }
    }

    skipTurn() {
        this.socketService.send('playerTurnEnd', true);
    }

    isActive(): boolean {
        return document.activeElement === this.rackCanvas.nativeElement.parentNode?.parentNode?.parentNode?.parentNode;
    }
}
