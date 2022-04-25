import { Dictionnary } from './dictionnary';
import { Rack } from './rack';

export interface Info {
    id: string;
    name: string;
    room: string;
    time: number;
    rack: Rack;
    points: number;
    mode: string;
    dict?: Dictionnary;
}
