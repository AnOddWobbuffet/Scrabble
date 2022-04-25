import { Component, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Name } from '@common/classes/name';

interface NameUpdate {
    name: string;
    difficulty: string;
    action: string;
    allNames: Name[];
    formName: string;
}

@Component({
    selector: 'app-name-dialog',
    templateUrl: './name-dialog.component.html',
    styleUrls: ['./name-dialog.component.scss'],
})
export class NameDialogComponent {
    localData: NameUpdate;
    action: string;
    formName: string;
    allNames: Name[];
    invalidName: string;

    constructor(
        public socketService: SocketService,
        public dialogRef: MatDialogRef<NameDialogComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: NameUpdate,
    ) {
        this.localData = { ...data };
        this.action = this.localData.action;
        this.allNames = this.localData.allNames;
        this.formName = this.localData.name;
        this.invalidName = '';
    }

    doAction() {
        this.formName = this.formName.trimLeft().trimRight();
        this.invalidName = this.validateName(this.formName);
        if (this.invalidName === '') {
            this.localData.formName = this.formName;
            this.dialogRef.close({ event: this.action, data: this.localData });
        }
    }

    validateName(name: string) {
        for (const aiName of this.allNames)
            if (name === aiName.name && name !== this.localData.name) return 'Le nom existe déjà dans la base de donnée';
        if (!name || name === '' || name.trim().length === 0) return 'Le nom ne peut pas être vide';
        return '';
    }

    closeDialog() {
        this.dialogRef.close({ event: 'Cancel' });
    }
}
