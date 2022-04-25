import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { Tile } from '@app/classes/tile/tile';
import { InfoPanelComponent } from '@app/components/info-panel/info-panel.component';
import { RackComponent } from '@app/components/rack/rack.component';
import { ResizerService } from '@app/services/resizer/resizer.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Vec2 } from '@common/classes/vec2';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, AfterViewInit {
    @ViewChild('boardCanvas') boardCanvas: ElementRef<HTMLCanvasElement>;
    @Input() rackComp: RackComponent;
    @Input() infoPanel: InfoPanelComponent;
    letterFont: number;
    pointsFont: number;
    context: CanvasRenderingContext2D;
    tempRack: Tile[];
    board: Tile[][];
    colorTiles: number[][][];
    colArr: string[];
    columnNumbers: number[];
    rowLetters: string[];
    lastClickedPos: Vec2;
    currentPos: Vec2;
    skippedPos: Vec2[];
    horizontal: boolean;
    writing: boolean;
    canWrite: boolean;
    size: number;
    tileSize: number;
    wordPlaced: string;

    constructor(public socketService: SocketService, public resizerService: ResizerService, private cd: ChangeDetectorRef) {
        this.colorTiles = [];
        this.colArr = [Constants.CANVAS.RED, Constants.CANVAS.BLUE, Constants.CANVAS.PINK, Constants.CANVAS.LIGHTBLUE];
        this.columnNumbers = Constants.BOARD.COLUMN_NUMBERS;
        this.rowLetters = Constants.BOARD.ROW_LETTERS;
        this.lastClickedPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.skippedPos = [];
        this.horizontal = true;
        this.writing = false;
        this.canWrite = false;
        this.size = Constants.CANVAS.CANVAS_SIZE;
        this.tileSize = Constants.CANVAS.TILE_SIZE;
        this.wordPlaced = '';
    }

    @HostListener('window:resize', ['$event'])
    sizer() {
        this.size = Math.min(window.innerHeight, innerWidth) / Constants.RESIZER.WINDOW_DIVIDER;
        this.tileSize = this.size / Constants.BOARD.BOARD_LENGTH;
        this.draw();
    }

    @HostListener('document:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        if (this.isActive()) this.keyboardPressed(event.key);
    }

    keyboardPressed(keyPressed: string) {
        keyPressed = keyPressed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let letter = keyPressed;
        this.writing = true;
        if (keyPressed === keyPressed.toUpperCase()) {
            letter = '*';
        }
        if (this.canWrite && keyPressed.match(/(\w|\s)/g) && this.rackComp.rack.getRackLetters().includes(letter.toUpperCase())) {
            this.addLetter(keyPressed, letter);
        } else
            switch (keyPressed) {
                case 'Backspace': {
                    this.removeLetter();
                    break;
                }
                case 'Enter': {
                    this.confirmWord();
                    break;
                }
                case 'Escape': {
                    this.cancelWord();
                    break;
                }
            }
    }
    ngAfterViewInit() {
        this.context = (this.boardCanvas.nativeElement as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
        this.socketService.send('requestBoardData');
        this.resizeLetters(this.resizerService.getSize());
        this.sizer();
        this.cd.detectChanges();
    }

    ngOnInit() {
        this.initializeBoard();
        this.waitForBoardUpdates();
    }

    waitForBoardUpdates() {
        this.socketService.on('receiveBoardData', (receivedBoard: Tile[][]) => {
            this.board = receivedBoard;
            this.draw();
        });
    }

    resizeLetters(newSize: number) {
        this.letterFont = newSize;
        this.pointsFont = newSize / 2;
        this.draw();
    }

    draw() {
        this.boardCanvas.nativeElement.width = this.size;
        this.boardCanvas.nativeElement.height = this.size;
        this.context.textBaseline = 'middle';
        this.context.textAlign = 'center';
        this.makeTilesColor();
        this.makeBonusTiles();
        this.context.fillStyle = Constants.CANVAS.BLACK;
        for (let i = 0; i < Constants.BOARD.BOARD_LENGTH; i++) {
            for (let j = 0; j < Constants.BOARD.BOARD_LENGTH; j++) {
                const x = j * this.tileSize;
                const y = i * this.tileSize;
                const tile = this.board[i][j];

                this.context.beginPath();
                this.drawLetter(tile, x, y);
            }
        }
    }

    drawLetter(tile: Tile, x: number, y: number) {
        if (tile.letter !== '-') {
            this.context.fillStyle = 'white';
            this.context.fillRect(x, y, this.tileSize, this.tileSize);
            this.context.fillStyle = Constants.CANVAS.BLACK;
            this.context.font = this.letterFont + Constants.CANVAS.FONT_STYLE;
            this.context.fillText(tile.letter, x + this.tileSize / 2, y + this.tileSize / 2);
            this.context.font = this.pointsFont + Constants.CANVAS.FONT_STYLE;
            this.context.fillText(
                tile.points.toString(),
                x + (this.tileSize / 2) * Constants.CANVAS.SPACING_FACTOR,
                y + (this.tileSize / 2) * Constants.CANVAS.SPACING_FACTOR,
            );
        }
        this.context.rect(x, y, this.tileSize, this.tileSize);
        this.context.stroke();
    }

    makeBonusTiles() {
        for (let i = 0; i < this.colArr.length; i++) {
            for (const coordinates of this.colorTiles[i]) {
                const x = coordinates[0] * this.tileSize;
                const y = coordinates[1] * this.tileSize;
                this.context.fillStyle = this.colArr[i];
                this.context.fillRect(x, y, this.tileSize, this.tileSize);
                this.context.font = this.pointsFont + Constants.CANVAS.FONT_STYLE;
                this.context.fillStyle = Constants.CANVAS.BLACK;
                this.context.fillText(Constants.BOARD.BONUS_TYPE_ARRAY[i], x + this.tileSize / 2, y + this.tileSize / Constants.RESIZER.MIDDLE_TILE);
                this.context.fillText(
                    Constants.BOARD.BONUS_ARRAY[i],
                    x + this.tileSize / 2,
                    y + (this.tileSize / Constants.RESIZER.MIDDLE_TILE) * Constants.CANVAS.SPACING_FACTOR,
                );
            }
        }
        this.makeStarTile();
        this.colorTiles = [];
    }

    makeStarTile() {
        const x = Constants.BOARD.STAR_TILE[0] * this.tileSize;
        const y = Constants.BOARD.STAR_TILE[1] * this.tileSize;
        this.context.fillStyle = Constants.CANVAS.PINK;
        this.context.fillRect(x, y, this.tileSize, this.tileSize);
        this.context.fillStyle = Constants.CANVAS.BLACK;
        this.context.fillText('⭐', x + this.tileSize / 2, y + this.tileSize / 2);
    }

    initializeBoard() {
        this.board = [];
        for (let i = 0; i < Constants.BOARD.BOARD_LENGTH; i++) {
            this.board[i] = [];
            for (let j = 0; j < Constants.BOARD.BOARD_LENGTH; j++) {
                this.board[i][j] = new Tile('-');
            }
        }
    }

    makeTilesColor() {
        this.colorTiles.push(Constants.BOARD.RED_TILES);
        this.colorTiles.push(Constants.BOARD.BLUE_TILES);
        this.colorTiles.push(Constants.BOARD.PINK_TILES);
        this.colorTiles.push(Constants.BOARD.LIGHT_BLUE_TILES);
    }
    highlightTile(pos: Vec2) {
        this.context.beginPath();
        this.context.strokeStyle = '#2ba245';
        this.context.lineWidth = 4;
        this.context.rect(pos.x * this.tileSize, pos.y * this.tileSize, this.tileSize, this.tileSize);
        this.context.stroke();
    }
    highlightWord(pos: Vec2) {
        if (this.horizontal) {
            for (let i = this.lastClickedPos.x; i <= pos.x; i++) {
                this.highlightTile({ x: i, y: pos.y });
            }
        } else {
            for (let i = this.lastClickedPos.y; i <= pos.y; i++) {
                this.highlightTile({ x: pos.x, y: i });
            }
        }
    }
    drawArrow(pos: Vec2) {
        this.context.fillStyle = Constants.CANVAS.BLACK;
        this.context.font = this.pointsFont * 3 + Constants.CANVAS.FONT_STYLE;
        if (this.horizontal) this.context.fillText('➡️', pos.x * this.tileSize + this.tileSize / 2, pos.y * this.tileSize + this.tileSize / 2);
        else this.context.fillText('⬇️', pos.x * this.tileSize + this.tileSize / 2, pos.y * this.tileSize + this.tileSize / 2);
    }
    handleClick(event: MouseEvent) {
        if (event.button === Constants.MOUSE_BUTTON.Left && !this.writing && this.infoPanel.currentPlayer === this.infoPanel.name) {
            const x = Math.ceil(event.offsetX / this.tileSize) - 1;
            const y = Math.ceil(event.offsetY / this.tileSize) - 1;
            this.currentPos = { x, y };
            this.draw();
            if (this.lastClickedPos.x !== this.currentPos.x || this.lastClickedPos.y !== this.currentPos.y) {
                this.lastClickedPos.x = this.currentPos.x;
                this.lastClickedPos.y = this.currentPos.y;
                this.horizontal = true;
            } else {
                this.horizontal = !this.horizontal;
            }
            if (this.board[this.currentPos.y][this.currentPos.x].letter === '-') {
                this.drawArrow(this.currentPos);
                this.canWrite = true;
                this.tempRack = this.rackComp.rack.clone();
            }
        }
    }
    addLetter(keyPressed: string, letter: string) {
        if (
            this.currentPos.x < Constants.BOARD.BOARD_LENGTH &&
            this.currentPos.y < Constants.BOARD.BOARD_LENGTH &&
            this.board[this.currentPos.y][this.currentPos.x].letter === '-'
        ) {
            this.board[this.currentPos.y][this.currentPos.x] = new Tile(keyPressed);
            this.wordPlaced += keyPressed;
            this.draw();
            this.rackComp.removeLetter(letter);
            this.rackComp.size = this.size;
            this.rackComp.tileSize = this.tileSize;
            this.rackComp.draw();
            if (this.currentPos.x < Constants.BOARD.BOARD_LENGTH - 1 && this.currentPos.y < Constants.BOARD.BOARD_LENGTH - 1) {
                if (this.horizontal) this.currentPos.x += 1;
                else if (!this.horizontal) this.currentPos.y += 1;
                if (this.board[this.currentPos.y][this.currentPos.x].letter !== '-') {
                    this.wordPlaced += this.board[this.currentPos.y][this.currentPos.x].letter;
                    this.skippedPos.push({ x: this.currentPos.x, y: this.currentPos.y });
                    if (this.horizontal) this.currentPos.x += 1;
                    else this.currentPos.y += 1;
                }
                this.drawArrow(this.currentPos);
            }
            this.highlightWord(this.currentPos);
        }
    }
    confirmWord() {
        this.writing = false;
        this.canWrite = false;
        this.rackComp.size = this.size;
        this.rackComp.tileSize = this.tileSize;
        this.rackComp.rack.rack = this.tempRack;
        this.rackComp.draw();
        this.socketService.send('wordPlaced', { word: this.wordPlaced, pos: this.lastClickedPos, h: this.horizontal });
        this.socketService.send('playerTurnEnd', false);
        this.socketService.send('requestBoardData');
        this.wordPlaced = '';
    }
    cancelWord() {
        if (!this.canWrite) return;
        this.rackComp.size = this.size;
        this.rackComp.tileSize = this.tileSize;
        this.writing = false;
        this.canWrite = false;
        this.socketService.send('requestBoardData');
        this.wordPlaced = '';
        this.rackComp.rack.rack = this.tempRack;
        this.rackComp.draw();
    }
    removeLetter() {
        if (this.horizontal && this.currentPos.x > this.lastClickedPos.x && this.board[this.currentPos.y][this.currentPos.x].letter === '-')
            this.currentPos.x -= 1;
        else if (!this.horizontal && this.currentPos.y > this.lastClickedPos.y && this.board[this.currentPos.y][this.currentPos.x].letter === '-')
            this.currentPos.y -= 1;
        for (const pos of this.skippedPos) {
            if (pos.x === this.currentPos.x && pos.y === this.currentPos.y) {
                if (this.horizontal && this.currentPos.x > this.lastClickedPos.x) this.currentPos.x -= 1;
                else if (!this.horizontal && this.currentPos.y > this.lastClickedPos.y) this.currentPos.y -= 1;
                this.skippedPos.splice(this.skippedPos.indexOf(pos), 1);
            }
        }
        const keyRemoved = this.board[this.currentPos.y][this.currentPos.x].letter;
        this.rackComp.size = this.size;
        this.rackComp.tileSize = this.tileSize;
        if (keyRemoved === keyRemoved.toUpperCase()) {
            this.rackComp.addLetter('*');
        } else {
            this.rackComp.addLetter(keyRemoved);
        }
        this.rackComp.draw();
        this.board[this.currentPos.y][this.currentPos.x] = new Tile('-');
        this.draw();
        this.highlightWord(this.currentPos);
        this.drawArrow(this.currentPos);
        this.wordPlaced = this.wordPlaced.slice(0, this.wordPlaced.length - 1);
    }

    isActive(): boolean {
        return document.activeElement === this.boardCanvas.nativeElement.parentNode?.parentNode?.parentNode?.parentNode;
    }
}
