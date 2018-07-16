import { Injectable } from '@angular/core';
import { timer } from 'rxjs/observable/timer';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Observer } from 'rxjs/Observer';
import { MessageFetchService } from './message.fetch.service';
import { UserManagerService } from '../../common/user.manager.service';
import { Subject } from 'rxjs/Subject';

import { IMessage } from '../models/message.model';

interface IToggledMessage extends IMessage {
    isHandled: boolean;
}

@Injectable()
export class MessageSyncronizeService {
    $core: Observer<any>;
    _observable: Observable<any>;
    messageChangeSub: Subscription;

    changedMessages: IToggledMessage[] = [];
    messagesForSync: IToggledMessage[] = [];
    uploadMessagesExecute: boolean;
    constructor(
        private fetchService: MessageFetchService,
        private userManager: UserManagerService
    ) {
        this.$core = this._observable = new Subject();
        /** sub process for make relation with user more faster */
        timer(0, 500).subscribe(() => {
            if (this.uploadMessagesExecute) { return; }
            if (this.changedMessages.length) {
                this.messagesForSync = this.changedMessages.filter(item => !item.isHandled);
                this.changedMessages = this.changedMessages.map(msg =>
                    !!this.messagesForSync.find(syncMsg => syncMsg.messageId === msg.messageId) ? {...msg, isHandled: true} : msg
                );
                this.$core.next(this.messagesForSync);
            }
        });
        /** main process */
        this.messageChangeSub = timer(1000, 5000).subscribe(() => {
            if (!this.messagesForSync.length) { return; }
                this.uploadMessagesExecute = true;
                this.fetchService.setMessagesAsVisible(this.messagesForSync).subscribe(response => {
                    if (response) {
                        this.userManager.reNewAccessToken(response['accessToken']);
                        if (response.result) {
                            this.$core.next(this.messagesForSync);
                            this.messagesForSync = [];
                        }
                    }
                }, error => {
                    /** send error report on server */
                });
            }
        );
    }
    init() {
        return this._observable;
    }
    setMessageAsChanged(message: IMessage) {
        let isExist = false;
        this.changedMessages.forEach(item => item.messageId === message.messageId && (isExist = true));
        if (!isExist) {
            this.changedMessages.push({
                ...message,
                isHandled: false
            });
        }
    }
}
