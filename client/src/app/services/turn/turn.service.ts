import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TurnService {
    canMove: boolean;

    getCanMove(): boolean {
        return this.canMove;
    }

    setCanMove(canMove: boolean) {
        this.canMove = canMove;
    }
}
