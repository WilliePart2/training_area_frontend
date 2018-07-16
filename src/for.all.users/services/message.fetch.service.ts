import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../common/base.service';
import { UserManagerService } from '../../common/user.manager.service';
import { UrlService } from '../../common/url.service';
import { IMessage } from '../models/message.model';

@Injectable()
export class MessageFetchService extends BaseService {
    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private url: UrlService
    ) {
        super(userManager, http);
    }
    getUsersCorrespondences(requestOwnerId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorMessage()}/get-user-correspondences`,
                {requestOwnerId},
                {headers}
            );
        });
    }
    getAddressees(userId: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.url.getMentorMessage()}/get-user-messages-addressees?uid=${userId}`,
                {headers}
            );
        });
    }
    creaateUserChatRoom(recipients: number[], message: string, topic: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorMessage()}/create-user-chat-room`,
                {
                    recipients,
                    message,
                    topic
                },
                {headers}
            );
        });
    }
    getMessages(roomId: string, checkNewMessages?: boolean, getFrom?: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.url.getMentorMessage()}/get-user-messages?roomId=${roomId}&check=${!!checkNewMessages}&from=${getFrom || 0}`,
                {headers}
            );
        });
    }
    sendMessage(obj: IMessage, roomId: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorMessage()}/send-message`,
                {
                    message: obj.message,
                    senderId: obj.senderId,
                    roomReceiverId: roomId
                },
                {headers}
            );
        });
    }
    deleteMessage(messageId: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorMessage()}/delete-user-message`,
                {
                    messageId
                },
                {headers}
            );
        });
    }
    setMessagesAsVisible(messages: IMessage[]) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMessage()}/set-messages-as-considered`,
                {messages},
                {headers}
            );
        });
    }
    deleteChatRoom(roomId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMessage()}/delete-chat-room`,
                {roomId},
                {headers}
            );
        });
    }
}
