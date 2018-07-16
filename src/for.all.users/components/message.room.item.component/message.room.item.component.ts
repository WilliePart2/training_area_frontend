import { Component, Input, OnInit, AfterViewInit, OnChanges, OnDestroy, Output, EventEmitter, Inject, ElementRef, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { throttleTime } from 'rxjs/operator/throttleTime';
import { timer } from 'rxjs/observable/timer';
import { trigger, transition, style, animate } from '@angular/animations';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { MessageFetchService } from '../../services/message.fetch.service';
import { LabelService } from '../../../common/label.service';
import { TotalMessageService } from '../../services/total.message.service';
import { Subscription } from 'rxjs/Subscription';
import { MessageSyncronizeService } from '../../services/message.syncronize.service';
import { MessageDateService } from '../../services/message.date.service';

import { IMessage } from '../../models/message.model';
import { UserBaseModel } from '../../../common/models/user.base.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { MessageCommonLabels } from '../../../common/models/message.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';


@Component({
    selector: 'app-message-room-item',
    templateUrl: 'message.room.item.component.html',
    styleUrls: ['./message.room.item.component.css'],
    animations: [
        trigger('dropingMessage', [
            transition('* => void', [
                style({
                    opacity: 1,
                    height: '*'
                }),
                animate('300ms', style({
                    opacity: 0,
                    height: '0'
                }))
            ])
        ])
    ]
})

export class MessageRoomItemComponent extends ProtectedComponent implements OnInit, OnChanges, OnDestroy {
    @Input() message: IMessage;
    @Input() members: UserBaseModel[];
    @Output() dropMessage = new EventEmitter<IMessage>();
    sender: UserBaseModel;
    isOwnMessage: boolean;
    messageDate: string;

    _commonLabels: MessageCommonLabels;
    _errorLabels: ErrorLabelsModel;

    @ViewChild('msgItem') messageItem: ElementRef;
    @Input() messageContainer: HTMLElement;
    @Input() isScrollInStartPosition: boolean; /** this flag will ebalbled when we scrolled our message list down */

    scrollContainerSub: Subscription;

    messageSyncSub: Subscription;

    dateUpdateSub: Subscription;


    constructor(
        protected userManager: UserManagerService,
        private messageService: TotalMessageService,
        private fetchService: MessageFetchService,
        private labelService: LabelService,
        private messageSyncronize: MessageSyncronizeService,
        private dateService: MessageDateService,
        @Inject('Window') private _window
    ) {
        super(userManager);
    }

    ngOnInit() {
        this.getSender();
        this.messageDate = this.message.messageDate;
        this.isOwnMessage = +this.userManager.id === +this.sender.id;
        this.dateUpdateSub = timer(0, 1000 * 60).subscribe(() => {
            this.message.messageDate = this.dateService.convertToReadable(this.messageDate);
        });

        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.MESSAGE_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.messageSyncSub = this.messageSyncronize.init().subscribe((messages: IMessage[]) => {
            messages.forEach(item => item.messageId === this.message.messageId ? (this.message.isConsidered = true) : null);
        });
    }
    ngOnChanges() {
        /** operation which be executed only with 'other' messages */
        if (this.isOwnMessage) { return; }
        if (!this.message.isConsidered && this.messageContainer && this.messageItem) {
            this.scrollContainerSub = fromEvent(this.messageContainer, 'scroll').subscribe((event: Event) => {
                    const elt = this.messageItem.nativeElement;
                    const containerPosition = this.messageContainer.getBoundingClientRect();
                    const itemPosition = elt.getBoundingClientRect();
                    if (itemPosition.top > containerPosition.top && itemPosition.bottom < containerPosition.bottom) {
                        this.messageSyncronize.setMessageAsChanged(this.message);
                    }
           });
       }
    }
    ngOnDestroy() {
        if (this.dateUpdateSub) { this.dateUpdateSub.unsubscribe(); }
        if (this.scrollContainerSub) { this.scrollContainerSub.unsubscribe(); }
        if (this.messageSyncSub) { this.messageSyncSub.unsubscribe(); }
    }

    getSender() {
        if (!this.members) { return; }
        this.sender = this.members.find(member => +member.id === +this.message.senderId);
    }
    goToUser() {
        if (this.sender) {
            this.userManager.redirectUser(`${this.userManager.type}/user-page`, {id: this.sender.id});
        }
    }
    deleteMessage() {
        this.enableDimmer();
        this.fetchService.deleteMessage(this.message.messageId).subscribe(response => {
            this.checkResponse(response, resp => {
                this.disableDimmer();
                this.dropMessage.emit(this.message);
            });
            if (!response || !response.resuult) { this.disableDimmer(); }
        }, error => {
            this.disableDimmer();
            this.messageService.sendErrorMessage(this._errorLabels.ERROR_DELETING_MESSAGE);
        });
    }
}
