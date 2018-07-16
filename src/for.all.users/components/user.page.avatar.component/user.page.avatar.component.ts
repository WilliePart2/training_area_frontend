import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-user-page-avatar',
    templateUrl: './user.page.avatar.component.html'
})

export class UserPageAvatarComponent {
    @Input('avatar') avatar: string;
    @Input('username') username: string;
    @Input('type') type: string;
}
