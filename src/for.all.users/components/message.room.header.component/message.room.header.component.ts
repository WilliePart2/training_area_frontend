import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { LabelService } from '../../../common/label.service';

import { UserBaseModel } from '../../../common/models/user.base.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { CommonLabels } from '../../../common/models/common.labels';

type _ = LABEL_GROUP_NAMES;

@Component({
    selector: 'app-message-room-header',
    templateUrl: 'message.room.header.component.html',
    styleUrls: ['./message.room.header.component.css']
})

export class MessageRoomHeaderComponent extends ProtectedComponent implements OnInit {
    @Input() member: UserBaseModel;
    @Input() hover: boolean;
    @Output() hoverChange = new EventEmitter<boolean>(true);

    memberOnHover: boolean;

    _commonLabels: CommonLabels;

    constructor(
        protected userManager: UserManagerService,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.COMMON_LABELS];
    }

    setHover() {
        this.hoverChange.emit(true);
    }
    dropHover() {
        this.hoverChange.emit(false);
    }
    goToUserPage(userId: number) {
        this.userManager.redirectUser(`${this.userManager.type}/user-page`, {id: userId});
    }
}
