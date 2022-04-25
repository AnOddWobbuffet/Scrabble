import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketService } from '@app/services/socket/socket-communication.service';
import { Info } from '@common/classes/info';

@Component({
    selector: 'app-join-room',
    templateUrl: './join-room.component.html',
    styleUrls: ['./join-room.component.scss'],
})
export class JoinRoomComponent implements OnInit {
    roomList: Info[];
    classicList: Info[];
    log2990List: Info[];

    constructor(
        public socketService: SocketService,
        public communicationService: CommunicationService,
        public dialogRef: MatDialogRef<JoinRoomComponent>,
    ) {
        this.roomList = [];
        this.classicList = [];
        this.log2990List = [];
    }

    ngOnInit() {
        this.requestRoomList();
        this.receiveRoomList();
    }

    joinRoom(room: Info) {
        this.dialogRef.close();
        this.socketService.send('requestJoinRoom', room);
        this.communicationService.hostInfo = room;
    }

    requestRoomList() {
        this.socketService.send('roomList');
    }

    receiveRoomList() {
        this.socketService.on('roomListMessage', (roomList: Info[]) => {
            this.roomList = roomList.slice(0);
            this.splitList();
        });
    }

    splitList() {
        this.classicList = [];
        this.log2990List = [];
        for (const room of this.roomList) {
            if (room.mode === 'classique') this.classicList.push(room);
            else this.log2990List.push(room);
        }
    }

    joinRandomRoom(list: Info[]) {
        const randomRoom = list[Math.floor(Math.random() * list.length)];
        this.socketService.send('requestJoinRoom', randomRoom);
        this.communicationService.hostInfo = randomRoom;
    }

    onClose() {
        this.dialogRef.close();
    }
}
