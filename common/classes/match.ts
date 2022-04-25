export class Match {
    date: Date;
    duration: number;
    playerOneName: string;
    playerOnePoints: number;
    playerTwoName: string;
    playerTwoPoints: number;
    mode: string;
    abandon: boolean;
    solo: boolean;

    constructor() {
        this.date = new Date();
        this.abandon = false;
    }

    getInitialMatchInfo(playerOneName: string, playerTwoName: string, mode: string, solo: boolean) {
        this.playerOneName = playerOneName;
        this.playerTwoName = playerTwoName;
        this.mode = mode;
        this.solo = solo;
        this.date = new Date();
    }

    getEndingMatchInfo(playerOnePoints: number, playerTwoPoints: number, duration: number, solo: boolean) {
        this.playerOnePoints = playerOnePoints;
        this.playerTwoPoints = playerTwoPoints;
        this.duration = duration;
        this.solo = solo;
    }
}
