import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { LabelService } from '../../../common/label.service';
import { MessageFetchService } from '../../services/message.fetch.service';
import { TotalMessageService } from '../../services/total.message.service';

import { IMessageRoomBasic } from '../../models/message.room.model';
import { UserBaseModel } from '../../../common/models/user.base.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { MessageCommonLabels } from '../../../common/models/message.common.labels';
import { MessageActionLabels } from '../../../common/models/message.action.labels';

@Component({
    selector: 'app-message-topic-item',
    templateUrl: 'message.topic.item.component.html',
    styleUrls: ['./message.topic.item.component.css']
})

export class MessageTopicItemComponent extends ProtectedComponent implements OnInit {
    @Input() item: IMessageRoomBasic;
    @Output() deleteRoom = new EventEmitter<IMessageRoomBasic>();
    creator: UserBaseModel;

    _commonLabels: MessageCommonLabels;
    _actionLabels: MessageActionLabels;

    constructor(
        private labelService: LabelService,
        protected userManager: UserManagerService,
        private fetchService: MessageFetchService,
        private messageService: TotalMessageService
    ) {
        super(userManager);
    }

    ngOnInit() {
        this.findCreator();
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.MESSAGE_COMMON_LABELS];
        this._actionLabels = labels[LABEL_GROUP_NAMES.MESSAGE_ACTION_LABELS];
    }

    findCreator() {
        if (!this.item) { return; }
        this.creator = this.item.members.find(member => member.id === this.item.roomOwner);
    }
    showMessageRoom() {
        this.userManager.redirectUser(`${this.userManager.type}/messages/message-room`, {roomId: this.item.roomId});
    }
    showUser(event: MouseEvent, userId: number) {
        event.stopPropagation();
        const elt: HTMLElement = event.target as HTMLElement;
        if (!elt || !elt.getAttribute('data-user')) { return; }
        this.userManager.redirectUser(`${this.userManager.type}/user-page`, {id: userId});
    }
    deleteMessageRoom(event: MouseEvent) {
        event.stopPropagation();
        this.enableDimmer();
        this.fetchService.deleteChatRoom(this.item.roomId).subscribe(response => {
            this.checkResponse(response, resp => {
                this.deleteRoom.emit(this.item);
                this.disableDimmer();
            });
        }, error => {
            this.disableDimmer();
            this.messageService.sendErrorMessage(this._actionLabels.DELTE_CHAT_ERROR);
        });
    }
}
