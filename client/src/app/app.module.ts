import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BoardComponent } from '@app/components/board/board.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { ClassicModePageComponent } from '@app/pages/classic-mode-page/classic-mode-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HostPageComponent } from '@app/pages/host-page/host-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ToastrModule } from 'ngx-toastr';
import { AdminComponent } from './components/admin/admin.component';
import { BestScoresComponent } from './components/best-scores/best-scores.component';
import { ChatComponent } from './components/chat/chat.component';
import { ConnectionComponent } from './components/connection/connection.component';
import { CreateRoomComponent } from './components/create-room/create-room.component';
import { GuestWaitingComponent } from './components/guest-waiting/guest-waiting.component';
import { HostWaitingComponent } from './components/host-waiting/host-waiting.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { RackComponent } from './components/rack/rack.component';
import { DictionnaryDialogComponent } from './dialog/dictionnary-dialog/dictionnary-dialog.component';
import { NameDialogComponent } from './dialog/name-dialog/name-dialog.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { BestScoresPageComponent } from './pages/best-scores-page/best-scores-page.component';
import { ConnectionPageComponent } from './pages/connection-page/connection-page.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { GuestWaitPageComponent } from './pages/guest-wait-page/guest-wait-page.component';
import { HostWaitPageComponent } from './pages/host-wait-page/host-wait-page.component';
import { ConcedeDialogComponent } from './dialog/concede-dialog/concede-dialog.component';
/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        ChatComponent,
        ClassicModePageComponent,
        ErrorPageComponent,
        HostPageComponent,
        JoinPageComponent,
        BoardComponent,
        RackComponent,
        ConnectionComponent,
        HostWaitPageComponent,
        JoinRoomComponent,
        CreateRoomComponent,
        HostWaitingComponent,
        GuestWaitPageComponent,
        ConnectionPageComponent,
        InfoPanelComponent,
        GuestWaitingComponent,
        BestScoresComponent,
        BestScoresPageComponent,
        AdminComponent,
        AdminPageComponent,
        NameDialogComponent,
        DictionnaryDialogComponent,
        ConcedeDialogComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        NoopAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ToastrModule.forRoot({ timeOut: 3000, progressBar: true, positionClass: 'toast-top-center', preventDuplicates: true }),
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
