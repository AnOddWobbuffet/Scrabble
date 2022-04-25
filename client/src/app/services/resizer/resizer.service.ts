import { Injectable } from '@angular/core';
import { Constants } from '@common/constants';
@Injectable({
    providedIn: 'root',
})
export class ResizerService {
    size: number;
    factor: number;

    constructor() {
        this.size = Constants.RESIZER.DEFAULT_SIZE;
    }

    getSize(): number {
        return this.size * this.factor;
    }

    decrement() {
        this.resize(Constants.RESIZER.DECREMENT);
    }
    increment() {
        this.resize(Constants.RESIZER.INCREMENT);
    }

    resize(size: number) {
        this.size = Math.min(Constants.RESIZER.MAX_SIZE, Math.max(Constants.RESIZER.MIN_SIZE, +this.size + size));
    }
}
