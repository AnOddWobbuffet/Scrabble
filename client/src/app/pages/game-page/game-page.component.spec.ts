import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ResizerService } from '@app/services/resizer/resizer.service';
import { GamePageComponent } from './game-page.component';

class ResizerServiceMock extends ResizerService {}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let resizerServiceMock: ResizerServiceMock;

    beforeEach(async () => {
        resizerServiceMock = new ResizerServiceMock();
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [GamePageComponent],
            providers: [{ provide: ResizerService, useValue: resizerServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        const boardComponent = jasmine.createSpyObj('board', ['resizeLetters']);
        const rackComponent = jasmine.createSpyObj('rack', ['resizeLetters']);
        component.board = boardComponent;
        component.rack = rackComponent;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call sizer', () => {
        const spy = spyOn(component, 'sizer');
        component.ngAfterViewInit();
        expect(spy).toHaveBeenCalled();
    });

    it('clicking the - button should call the decrement function of resizerService', () => {
        const spy = spyOn(component.resizerService, 'decrement');
        const button = fixture.debugElement.query(By.css('#smaller'));
        button.triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clicking the + button should call the increment function of resizerService', () => {
        const spy = spyOn(component.resizerService, 'increment');
        const button = fixture.debugElement.query(By.css('#bigger'));
        button.triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clicking button should call rackClick', () => {
        const spy = spyOn(component, 'rackClick');
        const button = fixture.debugElement.query(By.css('#rack'));
        button.triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clicking button should call boardClick', () => {
        const spy = spyOn(component, 'boardClick');
        const button = fixture.debugElement.query(By.css('#board'));
        button.triggerEventHandler('click', null);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('click on board should should set boardClicked and rackClicked', () => {
        fixture.debugElement.query(By.css('app-board')).triggerEventHandler('click', null);
        expect(component.boardClicked).toEqual(true);
        expect(component.rackClicked).toEqual(false);
    });

    it('rackClick should should set boardClicked and rackClicked', fakeAsync(() => {
        component.boardClicked = true;
        tick();
        component.rackClick();
        expect(component.boardClicked).toEqual(false);
        expect(component.rackClicked).toEqual(true);
    }));
});
