/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { ResizerService } from './resizer.service';

describe('ResizerService', () => {
    let service: ResizerService;
    const DEFAULT_SIZE = 18;
    const MAXSIZE = 21;
    const MINSIZE = 13;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ResizerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('resize should adjust size while staying within boundary', () => {
        expect(service.size).toEqual(DEFAULT_SIZE);
        service.resize(1);
        expect(service.size).toEqual(DEFAULT_SIZE + 1);
        service.resize(1);
        expect(service.size).toEqual(DEFAULT_SIZE + 2);
        service.size = MINSIZE;
        service.resize(-1);
        expect(service.size).toEqual(MINSIZE); // car on ne peut pas aller plus bas que la taille minimale
        service.size = MAXSIZE;
        service.resize(1);
        expect(service.size).toEqual(MAXSIZE); // car on ne peut pas aller plus haut que la taille maximale
    });

    it('decrement should decrement size by 1', () => {
        expect(service.size).toEqual(DEFAULT_SIZE);
        service.decrement();
        expect(service.size).toEqual(DEFAULT_SIZE - 1);
    });

    it('increment should increment size by 1', () => {
        expect(service.size).toEqual(DEFAULT_SIZE);
        service.increment();
        expect(service.size).toEqual(DEFAULT_SIZE + 1);
    });

    it('getSize should return size', () => {
        service.factor = 1;
        const size = service.getSize();
        expect(size).toEqual(DEFAULT_SIZE);
    });
});
