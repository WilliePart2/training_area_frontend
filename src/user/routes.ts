import { Routes } from '@angular/router';
import { UserIndexComponent } from './components/index/user.index.component';
import { UserMentorsComponent } from './components/mentors/user.mentors.component';
import { MentorsIndexComponent } from './components/mentors.index/mentors.index.component';
import { MentorsAllUsersComponent } from './components/mentors.all.users/mentors.all.users.component';
import { MentorsFromMentorComponent } from './components/mentors.from.mentor/mentors.from.mentor.component';

/** Universal components */
import { PadawanComponent } from '../mentor/components/padawan/padawan.component';
import { PadawanAllUserComponent } from '../mentor/components/all-users/padawan.all.user.component';
import {PadawanMyUsersComponent} from '../mentor/components/my.users/padawan.my.users.component';
import { UsersIndexComponent } from '../mentor/components/users.index.component/users.index.component';
import {UserPageComponent} from '../for.all.users/components/user.page.component/user.page.component';
import {SettingMainComponent} from '../for.all.users/components/setting.main.component/setting.main.component';
import {TrainingPlanCreateComponent} from '../training/components/training.plan.create/training.plan.create.component';
import {ListingTrainingPlansIndexComponent} from '../training/components/listing.training.plan.index/listing.training.plans.index.component';
import {ListingTrainingPlansComponent} from '../training/components/listing.training.plans/listing.training.plans.component';
import {CompleteTrainingPlanComponent} from '../training/components/complete.training.plan/complete.training.plan.component';
import {SearchTrainingPlansComponent} from '../training/components/search.training.plans/search.training.plans.component';
import {TrainingPlanViewIndexComponent} from '../training/components/training.plan.view.index/training.plan.view.index.component';
import {PadawanTrainingPlanViewComponent} from '../training/components/padawan.training.plan.view/padawan.training.plan.view.component';
import {CurrentTrainingPlanComponent} from '../training/components/current.training.plan/current.training.plan.component';
import {ListingCompletedPlansComponent} from '../training/components/listing.completed.plans/listing.completed.plans.component';
import {TrainingPlanViewCommentComponent} from '../training/components/training.plan.view.comment/training.plan.view.comment.component';
import {TrainingPlanViewComponent} from '../training/components/training.plan.view/training.plan.view.component';
import {TrainingIndexComponent} from '../training/components/index/training.index.component';
import {MessageWrapperComponent} from '../for.all.users/components/message.wrapper.component/message.wrapper.component';
import {MessageRoomComponent} from '../for.all.users/components/message.room.component/message.room.component';
import {MessageMainComponent} from '../for.all.users/components/message.main.component/message.main.component';
import {PadawanToMentorComponent} from '../mentor/components/to.mentor/padawan.to.mentor.component';

const messagesRoutes: Routes = [
    {path: '', component: MessageMainComponent, pathMatch: 'full'},
    {path: 'message-room', component: MessageRoomComponent}
];

const mentorChildRoutes: Routes = [
    {path: '', component: UsersIndexComponent /* MentorsIndexComponent */},
    {path: 'all-users', component: PadawanAllUserComponent /* MentorsAllUsersComponent */},
    {path: 'fetch-request', component: PadawanToMentorComponent /* MentorsFromMentorComponent */},
];

const trainingPlanRoutes: Routes = [
    {path: '', component: TrainingPlanViewComponent, pathMatch: 'full'},
    {path: 'comments', component: TrainingPlanViewCommentComponent}
];

const listingTrainingPlansRoutes: Routes = [
    {path: 'training-plan-view', component: TrainingPlanViewIndexComponent, children: trainingPlanRoutes},
    {path: 'padawan-training-plan-view', component: PadawanTrainingPlanViewComponent},
    {path: 'search-plans', component: SearchTrainingPlansComponent},
    {path: 'current-plan', component: CurrentTrainingPlanComponent},
    {path: 'completed-plans', component: ListingCompletedPlansComponent},
    {path: 'complete-plan', component: CompleteTrainingPlanComponent },
    {path: '', component: ListingTrainingPlansComponent, pathMatch: 'full'}
];

const childTrainingRoutes: Routes = [
    {path: 'training-plan-create', component: TrainingPlanCreateComponent},
    {path: '', component: ListingTrainingPlansIndexComponent, children: listingTrainingPlansRoutes}
];

export const userMainRoutes: Routes = [
    {path: '', component: UserIndexComponent},
    {path: 'mentors', component: PadawanComponent /* UserMentorsComponent */, children: mentorChildRoutes},
    {path: 'user-page', component: UserPageComponent},
    {path: 'setting', component: SettingMainComponent},
    {path: 'training', component: TrainingIndexComponent, children: childTrainingRoutes},
    {path: 'messages', component: MessageWrapperComponent, children: messagesRoutes}
];
