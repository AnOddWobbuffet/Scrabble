import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Info } from '@common/classes/info';
import { Message } from '@common/classes/message';
import { Constants } from '@common/constants';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    myInfo: Info;
    hostInfo: Info;
    myName: string;
    gameMode: string;
    mode: string;
    roomTime: number;
    private readonly baseUrl: string;

    constructor(private readonly http: HttpClient) {
        this.roomTime = Constants.TIME.TIMER;
        this.baseUrl = environment.serverUrl;
    }
    basicGet(): Observable<Message> {
        return this.http.get<Message>(`${this.baseUrl}/example`).pipe(catchError(this.handleError<Message>('basicGet')));
    }

    basicPost(message: Message): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/example/send`, message).pipe(catchError(this.handleError<void>('basicPost')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
