export class Panel {
    time: number;
    playerTurnName: string;
    remainingLetters: number;
    constructor(time: number, playerName: string, remainingLetters: number) {
        this.time = time;
        this.playerTurnName = playerName;
        this.remainingLetters = remainingLetters;
    }
}
