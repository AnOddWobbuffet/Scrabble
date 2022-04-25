import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Message } from '@common/classes/message';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    @Input()
    serverMessage: string;
    serverClock: Date;
    message: string;
    serverMessages: Message[];

    constructor(public socketService: SocketService) {
        this.serverMessage = '';
        this.message = '';
        this.serverMessages = [];
    }

    get socketId() {
        return this.socketService.socket.id ? this.socketService.socket.id : '';
    }

    ngOnInit() {
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures() {
        this.socketService.on('roomMessage', (userMessage: Message) => {
            this.serverMessages.push(userMessage);
        });
    }

    sendMessage() {
        if (this.message !== '') {
            this.socketService.send('roomMessage', this.message);
            this.message = '';
        }
    }
}
