/* eslint-disable @typescript-eslint/naming-convention */

import { Name } from './classes/name';
import { Score } from './classes/score';

interface Direction {
    RIGHT: number;
    LEFT: number;
}
interface Resizer {
    DEFAULT_SIZE: number;
    MAX_SIZE: number;
    MIN_SIZE: number;
    INCREMENT: number;
    DECREMENT: number;
    WINDOW_DIVIDER: number;
    MIDDLE_TILE: number;
    WINDOW_FACTOR: number;
}
interface Canvas {
    RED: string;
    PINK: string;
    BLUE: string;
    LIGHTBLUE: string;
    BLACK: string;
    CANVAS_SIZE: number;
    LETTER_SPACING: number;
    SPACING_FACTOR: number;
    TILE_SIZE: number;
    FONT_STYLE: string;
}
interface Board {
    BOARD_LENGTH: number;
    MIDDLE_POINT: number;
    COLUMN_NUMBERS: number[];
    ROW_LETTERS: string[];
    BONUS_TYPE_ARRAY: string[];
    BONUS_ARRAY: string[];
    STAR_TILE: number[];
    RED_TILES: number[][];
    PINK_TILES: number[][];
    BLUE_TILES: number[][];
    LIGHT_BLUE_TILES: number[][];
}
interface Time {
    DISCONNECT_INTERVAL: number;
    VALIDATION_INTERVAL: number;
    TIMER: number;
    ADMIN_TIME: number;
    MIN_TIME: number;
    MAX_TIME: number;
    INTERVAL: number;
    WAIT_TIME: number;
}
interface Ai {
    ACTIONS: string[];
    ACTIONS_PROBABILITIES: number[];
    PLAY_DELAY: number;
    END_TURN_DELAY: number;
    PLAYABLE_WORDS: number;
    POINTS_INTERVAL: number;
    MAX_WORDS: number;
}
interface Letters {
    TOTAL_LETTERS: number;
    ALL_LETTERS_BONUS: number;
    POINTS: string[];
    POINTS_PROBABILITIES: number[];
    LETTER_NUMBERS: number[];
    LETTER_LIST: string[];
}

interface Db {
    DATABASE_URL: string;
    DATABASE_NAME: string;
    DATABASE_CLASSIC_SCORES: string;
    DATABASE_LOG2990_SCORES: string;
    DATABASE_AI_NAMES: string;
    DATABASE_MATCH_HISTORY: string;
    DICT_INFO_PATH: string;
    SCORE_MAX_LENGTH: number;
    DEFAULT_DICT_PATH: string;
    DEFAULT_SCORES: Score[];
    DEFAULT_NAMES: Name[];
}

export class Constants {
    static readonly DIRECTION: Direction = {
        RIGHT: 1,
        LEFT: -1,
    };
    static readonly RESIZER: Resizer = {
        DEFAULT_SIZE: 18,
        MAX_SIZE: 21,
        MIN_SIZE: 13,
        INCREMENT: 1,
        DECREMENT: -1,
        WINDOW_DIVIDER: 1.5,
        MIDDLE_TILE: 2.5,
        WINDOW_FACTOR: 450,
    };
    static readonly CANVAS: Canvas = {
        RED: '#ff596a',
        PINK: '#ff9ea8',
        BLUE: '#a2b5eb',
        LIGHTBLUE: '#b3e8f2',
        BLACK: '#000000',
        CANVAS_SIZE: 600,
        LETTER_SPACING: 15,
        SPACING_FACTOR: 1.7,
        TILE_SIZE: 40,
        FONT_STYLE: 'px Arial',
    };
    static readonly BOARD: Board = {
        BOARD_LENGTH: 15,
        MIDDLE_POINT: 7,
        COLUMN_NUMBERS: Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15),
        ROW_LETTERS: Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'),
        BONUS_TYPE_ARRAY: ['Mot', 'Lettre', 'Mot', 'Lettre'],
        BONUS_ARRAY: ['x3', 'x3', 'x2', 'x2'],
        STAR_TILE: [7, 7],
        RED_TILES: [
            [0, 0],
            [14, 0],
            [7, 0],
            [0, 7],
            [0, 14],
            [14, 14],
            [7, 14],
            [14, 7],
        ],
        PINK_TILES: [
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
            [1, 13],
            [2, 12],
            [3, 11],
            [4, 10],
            [13, 13],
            [12, 12],
            [11, 11],
            [10, 10],
            [13, 1],
            [12, 2],
            [11, 3],
            [10, 4],
        ],
        BLUE_TILES: [
            [5, 1],
            [9, 1],
            [1, 5],
            [5, 5],
            [9, 5],
            [13, 5],
            [1, 9],
            [5, 9],
            [5, 13],
            [9, 13],
            [13, 9],
            [9, 9],
        ],
        LIGHT_BLUE_TILES: [
            [0, 3],
            [3, 0],
            [0, 11],
            [11, 0],
            [2, 6],
            [2, 8],
            [3, 7],
            [6, 2],
            [8, 2],
            [7, 3],
            [3, 14],
            [14, 3],
            [11, 14],
            [14, 11],
            [6, 12],
            [8, 12],
            [7, 11],
            [12, 6],
            [12, 8],
            [11, 7],
            [6, 6],
            [6, 8],
            [8, 6],
            [8, 8],
        ],
    };
    static readonly TIME: Time = {
        DISCONNECT_INTERVAL: 5000,
        VALIDATION_INTERVAL: 3000,
        TIMER: 60,
        ADMIN_TIME: 500,
        MIN_TIME: 30,
        MAX_TIME: 300,
        INTERVAL: 1000,
        WAIT_TIME: 10000,
    };
    static readonly AI: Ai = {
        ACTIONS: ['PassTurn', 'ExchangeLetters', 'Play'],
        ACTIONS_PROBABILITIES: [0.1, 0.1, 0.8],
        PLAY_DELAY: 3000,
        END_TURN_DELAY: 17000,
        PLAYABLE_WORDS: 5,
        POINTS_INTERVAL: 6,
        MAX_WORDS: 20,
    };
    static readonly LETTERS: Letters = {
        TOTAL_LETTERS: 102,
        ALL_LETTERS_BONUS: 50,
        POINTS: ['6', '12', '18'],
        POINTS_PROBABILITIES: [0.4, 0.3, 0.3],
        LETTER_NUMBERS: [9, 2, 2, 3, 15, 2, 2, 2, 8, 1, 1, 5, 3, 6, 6, 2, 1, 6, 6, 6, 6, 2, 1, 1, 1, 1, 2],
        LETTER_LIST: [
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            '*',
        ],
    };
    static readonly LETTER_POINTS = [
        ['*'],
        ['A', 'E', 'I', 'L', 'N', 'O', 'R', 'S', 'T', 'U'],
        ['D', 'G'],
        ['B', 'C', 'M', 'P'],
        ['F', 'H', 'V', 'W', 'Y'],
        ['K'],
        ['J', 'X'],
        ['Q', 'Z'],
    ];
    static readonly EIGHT_POINTS_INDEX = 6;
    static readonly TEN_POINTS_INDEX = 7;
    static readonly RACK_LENGTH = 7;
    static readonly ASCIIA = 65;
    static readonly ALPHABET_LETTERS = 26;
    static readonly MAX_LENGTH_MESSAGE = 512;
    static readonly MAX_TURNS_SKIPPED = 6;
    static readonly LAST_INDEX = -1;
    static readonly MOUSE_BUTTON = {
        Left: 0,
        Middle: 1,
        Right: 2,
        Back: 3,
        Forward: 4,
    };
    static readonly OBJECTIVES_LIST = new Map<string, number>([
        ['Placer une lettre qui touche un côté du plateau', 25],
        ['Placer un z', 10],
        ['Former 3 fois le même mot dans la partie', 20],
        ['Avoir une suite de 5 lettres consécutives en ordre alphabétique dans le chevalet', 40],
        ['Placer les deux lettres blanches dans la partie', 15],
        ['Former 3 mots en un placement', 30],
        ['Former un mot de 8 lettres et plus', 25],
        ['Former un mot de 3 lettres ou plus uniquement avec des voyelles', 15],
    ]);
    static readonly PUBLIC_OBJECTIVES_NUMBER = 2;

    static readonly HELP_COMMAND: string[][] = [
        ['PLACER DES LETTRES :', '!placer <ligne><colonne>(h | v) <lettres>', ' '],
        ['ÉCHANGER DES LETTRES (majuscule pour la lettre *) :', '!echanger <lettres>', ' '],
        ['RECEVOIR DES INDICES :', '!indice', ' '],
        ['AFFICHER LES LETTRES RESTANTES :', '!reserve', ' '],
        ['AFFICHER LES COMMANDES DISPONIBLES :', '!aide'],
    ];

    static readonly DB: Db = {
        DEFAULT_SCORES: [
            { username: ['Player1'], points: 5 },
            { username: ['Player2'], points: 10 },
            { username: ['Player3'], points: 15 },
            { username: ['Player4'], points: 20 },
            { username: ['Player5'], points: 25 },
        ],
        DATABASE_URL: `mongodb+srv://abilik:XJJDjSf1AqXG3zkb@cluster0.xr8n2.mongodb.net/
        test?authSource=admin&replicaSet=atlas-oep9v7-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`,
        DATABASE_NAME: 'Scrabble',
        DATABASE_CLASSIC_SCORES: 'classique',
        DATABASE_LOG2990_SCORES: 'LOG2990',
        DATABASE_AI_NAMES: 'Names',
        DATABASE_MATCH_HISTORY: 'MatchHistory',
        DICT_INFO_PATH: './assets/dictInfo.json',
        SCORE_MAX_LENGTH: 5,
        DEFAULT_DICT_PATH: './assets/dictionnary.json',
        DEFAULT_NAMES: [
            { name: 'Andy', difficulty: 'Novice' },
            { name: 'Chu', difficulty: 'Novice' },
            { name: 'Laurent', difficulty: 'Novice' },
            { name: 'Olivier', difficulty: 'Expert' },
            { name: 'Lucy', difficulty: 'Expert' },
            { name: 'Jason', difficulty: 'Expert' },
        ],
    };
}
