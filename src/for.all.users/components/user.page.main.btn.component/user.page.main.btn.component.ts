import { Component, Input, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { UserMessageService } from '../../services/user.message.service';

@Component({
    selector: 'app-user-page-main-btn',
    templateUrl: './user.page.main.btn.component.html',
    providers: [UserMessageService]
})
export class UserPageMainBtnComponent extends ProtectedComponent implements OnInit {
    @Input('type') type: 'user' | 'mentor';
    selfType: 'user' | 'mentor';
    constructor(
        protected userManager: UserManagerService,
        private userMessager: UserMessageService
    ) {
        super(userManager);
    }
    ngOnInit() {
        this.selfType = <'mentor' | 'user'>this.userManager.type;
    }
}
