import { TestBed } from '@angular/core/testing';
import { TurnService } from '@app/services/turn/turn.service';

describe('TurnService', () => {
    let service: TurnService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TurnService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('setCanMove should assign a bool to canMove and getCanMove should return correct bool', () => {
        const testBool = true;
        service.setCanMove(testBool);
        expect(service.canMove).toEqual(testBool);
        const result = service.getCanMove();
        expect(result).toEqual(testBool);
    });
});
