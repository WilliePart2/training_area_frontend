import { Component, OnInit } from '@angular/core';
import { UserManagerService } from '../../../common/user.manager.service';

@Component({
    selector: 'app-users-index',
    templateUrl: './users.index.component.html'
})

export class UsersIndexComponent implements OnInit {
    type: 'mentor' | 'user';
    constructor(protected userManager: UserManagerService) {}
    ngOnInit() {
        this.type = this.userManager.type;
    }
}
