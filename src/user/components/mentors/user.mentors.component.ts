import { Component, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';

@Component({
    selector: 'app-user-mentors',
    templateUrl: './user.mentors.component.html'
})
export class UserMentorsComponent extends ProtectedComponent { }
