import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DictionnaryDialogComponent } from '@app/dialog/dictionnary-dialog/dictionnary-dialog.component';
import { NameDialogComponent } from '@app/dialog/name-dialog/name-dialog.component';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Dictionnary } from '@common/classes/dictionnary';
import { Match } from '@common/classes/match';
import { Name } from '@common/classes/name';
import { Constants } from '@common/constants';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
    matchHistory: Match[];
    dictionnaries: Dictionnary[];
    aiNoviceNames: Name[];
    aiExpertNames: Name[];
    constructor(public socketService: SocketService, public dialog: MatDialog, private toastr: ToastrService) {
        this.matchHistory = [];
        this.dictionnaries = [];
        this.aiNoviceNames = [];
        this.aiExpertNames = [];
    }

    ngOnInit(): void {
        this.requestAll();
        this.receiveAll();
    }

    requestAll() {
        this.socketService.send('adminData');
    }

    receiveAll() {
        this.socketService.on('matches', (matches: Match[]) => {
            this.matchHistory = matches;
        });

        this.socketService.on('dictionnaries', (dict: Dictionnary[]) => {
            this.dictionnaries = dict;
        });

        this.socketService.on('noviceNames', (names: Name[]) => {
            this.aiNoviceNames = names;
        });

        this.socketService.on('expertNames', (names: Name[]) => {
            this.aiExpertNames = names;
        });
        this.socketService.on('downloadReceive', (dict: Dictionnary) => {
            const path = dict.path as string;
            const fileName = path.substring(path.lastIndexOf('/') + 1);
            delete dict.path;
            const blob = new Blob([JSON.stringify(dict)], { type: 'application/octet-stream' });
            const link = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = link;
            a.download = fileName;
            a.click();
        });
    }

    downloadRequest(path: string | undefined) {
        this.socketService.send('downloadRequest', path);
    }

    convertNumberToTime(duration: number) {
        const min = Math.floor(duration / Constants.TIME.TIMER);
        const sec = duration % Constants.TIME.TIMER;
        return 'Durée: ' + min + ' minutes' + ' et ' + sec + ' secondes';
    }

    isDefaultName(name: Name) {
        for (const aiName of Constants.DB.DEFAULT_NAMES) if (aiName.name === name.name) return true;
        return false;
    }

    isDefaultDict(dict: Dictionnary) {
        if (dict === this.dictionnaries[0]) return true;
        return false;
    }

    namePresentInLists(name: Name) {
        for (const aiName of this.aiNoviceNames) if (name.name === aiName.name) return true;
        for (const aiName of this.aiExpertNames) if (name.name === aiName.name) return true;
        return false;
    }

    dictPresentInList(dict: Dictionnary) {
        for (const dic of this.dictionnaries) if (dict.title === dic.title && dic.description === dict.description) return true;
        return false;
    }

    openNameDialog(action: string, name: Name) {
        const allNames: Name[] = this.aiNoviceNames.concat(this.aiExpertNames);
        const obj = { name: name?.name, difficulty: name?.difficulty, action, allNames };
        const dialogRef = this.dialog.open(NameDialogComponent, {
            disableClose: true,
            data: obj,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result.event !== 'Cancel') {
                const newName = { name: result.data.formName, difficulty: result.data.difficulty };
                switch (result.event) {
                    case 'Add':
                        if (this.namePresentInLists(newName)) this.toastr.error('Le nom ' + newName.name + ' existe déjà', 'Erreur');
                        else {
                            this.socketService.send('addName', newName);
                            this.toastr.success('Le nom ' + newName.name + ' a été ajouté', 'Succès');
                        }
                        break;
                    case 'Update':
                        if (!this.namePresentInLists(name))
                            this.toastr.error('Le nom ' + name.name + " n'existe plus ou il a été modifié par un autre utilisateur", 'Erreur');
                        else if (name.name === newName.name) this.toastr.info('le nom reste inchangé', 'Info');
                        else {
                            this.socketService.send('updateName', result.data);
                            this.toastr.success('Le nom ' + result.data.name + ' a été modifié pour ' + result.data.formName, 'Succès');
                        }
                        break;
                }
            }
        });
    }

    deleteName(name: Name) {
        this.socketService.send('deleteName', name);
        this.toastr.success('Le nom ' + name.name + ' a été supprimer', 'Succès');
    }

    openDictDialog(action: string, dict: Dictionnary) {
        const allDicts: Dictionnary[] = this.dictionnaries;
        const obj = { title: dict?.title, description: dict?.description, words: dict?.words, action, allDicts };
        const dialogRef = this.dialog.open(DictionnaryDialogComponent, {
            disableClose: true,
            data: obj,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result.event !== 'Cancel') {
                const newDict = {
                    title: result.data.formDict.title,
                    description: result.data.formDict.description,
                    words: result.data.formDict.words,
                };
                const upDict = {
                    oldTitle: result.data.title,
                    newTitle: result.data.formDict.title,
                    newDesc: result.data.formDict.description,
                    words: result.data.words,
                };
                switch (result.event) {
                    case 'Add':
                        if (this.dictPresentInList(newDict)) this.toastr.error('Le dictionnaire ' + newDict.title + ' existe déjà', 'Erreur');
                        else {
                            this.socketService.send('addDict', newDict);
                            this.toastr.success('Le dictionnaire ' + newDict.title + ' a été ajouté', 'Succès');
                        }
                        break;
                    case 'Update':
                        if (!this.dictPresentInList(dict))
                            this.toastr.error(
                                'Le dictionnaire ' + dict.title + " n'existe plus ou il a été modifié par un autre utilisateur",
                                'Erreur',
                            );
                        else if (upDict.oldTitle === upDict.newTitle && dict.description === upDict.newDesc)
                            this.toastr.info('le dictionnaire reste inchangé', 'Info');
                        else {
                            this.socketService.send('updateDict', upDict);
                            this.socketService.send('updateDictWaitingRoom', { oldTitle: upDict.oldTitle, newTitle: upDict.newTitle });
                            this.toastr.success('Le dictionnaire ' + upDict.oldTitle + ' a bien été modifié', 'Succès');
                        }
                        break;
                }
            }
        });
    }

    deleteDict(dictName: string) {
        this.socketService.send('deleteDict', dictName);
        this.socketService.send('deleteMSG', dictName);
        this.toastr.success('Le dictionnaire ' + dictName + ' a bien été supprimer', 'Succès');
    }

    reset(part: string) {
        this.socketService.send('resetPart', part);
    }
}
