import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostWaitPageComponent } from './host-wait-page.component';

describe('WaitPageComponent', () => {
    let component: HostWaitPageComponent;
    let fixture: ComponentFixture<HostWaitPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HostWaitPageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HostWaitPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
