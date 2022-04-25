import { Constants } from '@common/constants';

export class Tile {
    letter: string;
    points: number;

    constructor(letter: string) {
        this.letter = letter;
        this.setPoints(letter);
    }

    setPoints(letter: string) {
        for (let i = 0; i < Constants.LETTER_POINTS.length; i++) {
            if (Constants.LETTER_POINTS[i].includes(letter.toUpperCase())) {
                if (i === Constants.EIGHT_POINTS_INDEX) this.points = 8;
                else if (i === Constants.TEN_POINTS_INDEX) this.points = 10;
                else this.points = i;
                break;
            }
        }
    }
}
