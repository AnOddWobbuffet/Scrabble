import { Board } from '@app/classes/board/board';
import { GameService } from '@app/services/game-service';
import { LettersService } from '@app/services/letters-bank.service';
import { ObjectiveManager } from '@app/services/objective-manager';
import { Match } from '@common/classes/match';

export interface Room {
    name: string;
    board: Board;
    firstTurn: boolean;
    time: number;
    idList: string[];
    gameService: GameService;
    lettersService: LettersService;
    playerTurnID: string;
    isSolo: boolean;
    timer: NodeJS.Timer | null;
    isExpert: boolean | null;
    match: Match;
    mode: string;
    objectiveManager: ObjectiveManager;
}
