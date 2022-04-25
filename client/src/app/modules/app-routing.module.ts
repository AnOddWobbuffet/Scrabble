import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { BestScoresPageComponent } from '@app/pages/best-scores-page/best-scores-page.component';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { ConnectionPageComponent } from '@app/pages/connection-page/connection-page.component';
import { ErrorPageComponent } from '@app/pages/error-page/error-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { GuestWaitPageComponent } from '@app/pages/guest-wait-page/guest-wait-page.component';
import { HostPageComponent } from '@app/pages/host-page/host-page.component';
import { HostWaitPageComponent } from '@app/pages/host-wait-page/host-wait-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'classic_mode', component: ClassicModePageComponent },
    { path: 'host', component: HostPageComponent },
    { path: 'join', component: JoinPageComponent },
    { path: 'hostWaiting', component: HostWaitPageComponent },
    { path: 'guestWaiting', component: GuestWaitPageComponent },
    { path: 'connect', component: ConnectionPageComponent },
    { path: 'bestScores', component: BestScoresPageComponent },
    { path: 'admin', component: AdminPageComponent },
    { path: 'error', component: ErrorPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
