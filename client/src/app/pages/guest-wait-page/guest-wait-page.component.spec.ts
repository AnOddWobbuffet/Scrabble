import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestWaitPageComponent } from './guest-wait-page.component';

describe('ConnectionPageComponent', () => {
    let component: GuestWaitPageComponent;
    let fixture: ComponentFixture<GuestWaitPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GuestWaitPageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuestWaitPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
