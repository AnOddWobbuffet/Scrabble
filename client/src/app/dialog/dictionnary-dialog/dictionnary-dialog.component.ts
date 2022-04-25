import { Component, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Dictionnary } from '@common/classes/dictionnary';

interface DictUpdate {
    title: string;
    description: string;
    words: string[];
    action: string;
    allDicts: Dictionnary[];
    formDict: Dictionnary;
}

@Component({
    selector: 'app-dictionnary-dialog',
    templateUrl: './dictionnary-dialog.component.html',
    styleUrls: ['./dictionnary-dialog.component.scss'],
})
export class DictionnaryDialogComponent {
    localData: DictUpdate;
    action: string;
    allDicts: Dictionnary[];
    invalidDict: string[];
    formDict: Dictionnary;
    formTitle: string | unknown;
    formDesc: string | unknown;
    formWords: string[];
    selectedFile: Blob | undefined;
    component: { title: string; description: string; path: string }[];

    constructor(
        public socketService: SocketService,
        public dialogRef: MatDialogRef<DictionnaryDialogComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: DictUpdate,
    ) {
        this.localData = { ...data };
        this.action = this.localData.action;
        this.allDicts = this.localData.allDicts;
        this.invalidDict = [];

        if (this.action === 'Update') {
            this.formTitle = this.localData.title;
            this.formDesc = this.localData.description;
            this.formWords = ['abc'];
            this.formDict = { title: 'a', description: 'b', words: ['c'] };
        }
    }

    doAction() {
        this.isValidDict();
        if (this.invalidDict.length === 0) {
            if (!this.formDesc || this.formDesc === '' || (this.formDesc as string).trim().length === 0) this.formDesc = 'Aucune Description';
            if (this.action === 'Update') {
                this.formTitle = (this.formTitle as string).trimLeft().trimRight();
                this.formDesc = (this.formDesc as string).trimLeft().trimRight();
            }
            const newDict = { title: this.formTitle as string, description: this.formDesc as string, words: this.formWords };
            this.localData.formDict = newDict;
            this.dialogRef.close({ event: this.action, data: this.localData });
        }
    }

    closeDialog() {
        this.dialogRef.close({ event: 'Cancel' });
    }

    isValidDict() {
        this.invalidDict = [];
        if (
            (Object.keys(this.formDict).length === 3 &&
                (!('title' in this.formDict) || !('description' in this.formDict) || !('words' in this.formDict))) ||
            Object.keys(this.formDict).length !== 3
        ) {
            this.invalidDict.push(
                'Mauvais format de fichier: le fichier JSON doit contenir seulement et obligatoirement les clés title, description et words',
            );
            return;
        }
        this.isValidType();
    }

    isValidType() {
        if (!(typeof this.formTitle === 'string')) this.invalidDict.push('• title doit être une chaîne de caractères');
        else if (!this.formTitle || this.formTitle === '' || this.formTitle.trim().length === 0) this.invalidDict.push('• le titre est vide');
        if (!(typeof this.formDesc === 'string')) this.invalidDict.push('• description doit être une chaîne de caractères');
        if (!(this.formWords instanceof Array)) this.invalidDict.push('• words doit être un tableau contenant des mots');
        else {
            if (this.formWords.length === 0) this.invalidDict.push('• le dictionnaire contient aucun mots');
            for (const word of this.formWords)
                if (/[^a-zA-Z]/.test(word)) {
                    this.invalidDict.push('• un mot dans le dictionnaire contient un caractère invalid (ex: 1, @, un espace, ...)');
                    break;
                }
        }
        for (const dict of this.allDicts) {
            if (this.formTitle === dict.title && dict.title !== this.localData.title) {
                this.invalidDict.push('• un autre dictionnaire contient le même titre');
                break;
            }
        }
    }

    uploadFile(event: Event) {
        const input = (event.target as HTMLInputElement).files;
        this.selectedFile = input ? input[0] : undefined;
        const fileReader = new FileReader();
        if (this.selectedFile) {
            fileReader.readAsText(this.selectedFile, 'UTF-8');
            fileReader.onload = () => {
                this.processFileResult(fileReader.result);
            };
        }
    }

    processFileResult(result: string | ArrayBuffer | null) {
        if (result) {
            this.formDict = JSON.parse(result.toString());
            this.formTitle = JSON.parse(result.toString()).title;
            this.formDesc = JSON.parse(result.toString()).description;
            this.formWords = JSON.parse(result.toString()).words;
            if (this.formTitle && typeof this.formTitle === 'string') this.formTitle = this.formTitle.trimLeft().trimRight();
            if (this.formDesc && typeof this.formDesc === 'string') this.formDesc = this.formDesc.trimLeft().trimRight();
        }
    }
}
