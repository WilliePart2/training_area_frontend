import { Component, Input, ViewChild } from '@angular/core';
import * as Immutable from 'immutable';
import { UserManagerService } from '../../../common/user.manager.service';
import { IRelationUsers } from '../../models/essential.user.data.model';
import { SuiModalService, TemplateModalConfig, ModalTemplate} from 'ng2-semantic-ui';

@Component({
    selector: 'app-user-page-relation-users',
    templateUrl: './user.page.relation.user.component.html'
})
export class UserPageRelationUserComponent {
    @Input() type: 'user' | 'mentor';
    @Input() users: Array<IRelationUsers>;
    @Input() username: string;
    @ViewChild('usersModal') userModal: ModalTemplate<any, any, any>;
    constructor(
        private userManager: UserManagerService,
        private modalService: SuiModalService
    ) {}
    viewMoreUsers() {
        if (!this.users || this.users.length < 10) { return; }
        const config = new TemplateModalConfig<any, any, any>(this.userModal);
        this.modalService.open(config)
            .onApprove(() => {})
            .onDeny(() => {});
    }
    viewUserPage(userID: number) {
        const url = `/${this.userManager.type}`;
        this.userManager.redirectUser(`${url}/user-page`, {id: userID});
    }
}
