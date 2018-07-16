import { Routes } from '@angular/router';
import { IndexComponent } from './components/index/index.component';

/** Класы представлений padawan */
import { PadawanComponent } from './components/padawan/padawan.component';
import { PadawanMyUsersComponent } from './components/my.users/padawan.my.users.component';
import { PadawanAllUserComponent } from './components/all-users/padawan.all.user.component';
import { PadawanToMentorComponent } from './components/to.mentor/padawan.to.mentor.component';
import { PadawanFromMentorComponent } from './components/from.mentor/padawan.from.mentor.component';

/** Класы представлений training */
import { ListingTrainingPlansComponent } from '../training/components/listing.training.plans/listing.training.plans.component';
import {
    ListingTrainingPlansIndexComponent
} from '../training/components/listing.training.plan.index/listing.training.plans.index.component';
import { SearchTrainingPlansComponent } from '../training/components/search.training.plans/search.training.plans.component';
import { TrainingPlanCreateComponent } from '../training/components/training.plan.create/training.plan.create.component';
import { TrainingIndexComponent } from '../training/components/index/training.index.component';
import { TrainingPlanViewComponent } from '../training/components/training.plan.view/training.plan.view.component';
import { TrainingPlanViewIndexComponent } from '../training/components/training.plan.view.index/training.plan.view.index.component';
import { TrainingPlanViewCommentComponent } from '../training/components/training.plan.view.comment/training.plan.view.comment.component';
import { CurrentTrainingPlanComponent } from '../training/components/current.training.plan/current.training.plan.component';
import { ListingCompletedPlansComponent } from '../training/components/listing.completed.plans/listing.completed.plans.component';
import { CompleteTrainingPlanComponent } from '../training/components/complete.training.plan/complete.training.plan.component';
import { PadawanTrainingPlanViewComponent } from '../training/components/padawan.training.plan.view/padawan.training.plan.view.component';
import { SettingMainComponent } from '../for.all.users/components/setting.main.component/setting.main.component';
import { UserPageComponent } from '../for.all.users/components/user.page.component/user.page.component';
import { MessageMainComponent } from '../for.all.users/components/message.main.component/message.main.component';
import { MessageRoomComponent } from '../for.all.users/components/message.room.component/message.room.component';
import { MessageWrapperComponent } from '../for.all.users/components/message.wrapper.component/message.wrapper.component';
import {UserIndexComponent} from '../user/components/index/user.index.component';
import {UsersIndexComponent} from './components/users.index.component/users.index.component';

const messagesRoutes: Routes = [
    {path: '', component: MessageMainComponent, pathMatch: 'full'},
    {path: 'message-room', component: MessageRoomComponent}
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

const trainingChildRoutes: Routes = [
    {path: 'training-plan-create', component: TrainingPlanCreateComponent},
    // {path: 'training-plan-view', component: TrainingPlanViewIndexComponent, children: trainingPlanRoutes},
    {path: '', component: ListingTrainingPlansIndexComponent, children: listingTrainingPlansRoutes}
];

const padawansChildRoutes: Routes = [
    {path: '', component: UsersIndexComponent/* PadawanMyUsersComponent */, pathMatch: 'full'},
    {path: 'all-users', component: PadawanAllUserComponent},
    {path: 'fetch-request', component: PadawanToMentorComponent},
    {path: 'my-request', component: PadawanFromMentorComponent}
];

export const mainRoutes: Routes = [
    {path: '', component: IndexComponent},
    {path: 'padawan', component: PadawanComponent, children: padawansChildRoutes},
    {path: 'training', component: TrainingIndexComponent, children: trainingChildRoutes},
    {path: 'setting', component: SettingMainComponent},
    {path: 'user-page', component: UserPageComponent},
    {path: 'messages', component: MessageWrapperComponent, children: messagesRoutes}
];
