import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { SuiModule } from 'ng2-semantic-ui';

/** Импортируем класы представлений training */
import { TrainingIndexComponent } from '../training/components/index/training.index.component';
import { ListingTrainingPlansComponent } from '../training/components/listing.training.plans/listing.training.plans.component';
import { TrainingPlanItemComponent } from '../training/components/training.plan.item/training.plan.item.component';
import { RatingDirective } from '../training/directives/rating.directive';
import { TrainingPlanCreateComponent } from '../training/components/training.plan.create/training.plan.create.component';
import { ExerciseItemComponent } from '../training/components/exercise.item/exercise.item.component';
import { TrainingPlanViewComponent } from '../training/components/training.plan.view/training.plan.view.component';
import { TrainingMicrocicleComponent } from '../training/components/training.microcicle/training.microcicle.component';
import { PlanItemComponent } from '../training/components/plan.item/plan.item.component';
import { TrainingPlanViewCommentComponent } from '../training/components/training.plan.view.comment/training.plan.view.comment.component';
import { TrainingPlanViewIndexComponent } from '../training/components/training.plan.view.index/training.plan.view.index.component';
import { PlanCommentComponent } from '../training/components/plan.comment/plan.comment.component';
import { PlanCommentAddComponent } from '../training/components/plan.comment.add/plan.comment.add.component';
import { ChartComponent } from '../training/components/chart/chart.component';
import { GroupMarkDirective } from '../chart/directives/group.mark.directive';
import {
    ListingTrainingPlansIndexComponent
} from '../training/components/listing.training.plan.index/listing.training.plans.index.component';
import { SearchTrainingPlansComponent } from '../training/components/search.training.plans/search.training.plans.component';
import { CurrentTrainingPlanComponent } from '../training/components/current.training.plan/current.training.plan.component';
import { ListingCompletedPlansComponent } from '../training/components/listing.completed.plans/listing.completed.plans.component';
import { CompleteTrainingPlanComponent } from '../training/components/complete.training.plan/complete.training.plan.component';
import { TrainingItemComponent } from '../training/components/training.item/training.item.component';
import { ExerciseItemDirective } from '../training/directives/exercise.item.directive';
import { PadawanTrainingPlanViewComponent } from '../training/components/padawan.training.plan.view/padawan.training.plan.view.component';

/** Импортируем графики */
import { TrainingPlanChartComponent } from '../chart/components/training.plan.chart/training.plan.chart.component';
import { TrainingExerciseChartComponent } from '../chart/components/training.exercise.chart/training.exercise.chart.component';

/** Подключение классов представлений user */
import { UserMainComponent } from '../user/components/main/user.main.component';
import { UserIndexComponent } from '../user/components/index/user.index.component';
import { UserMentorsComponent } from '../user/components/mentors/user.mentors.component';
import { MentorsIndexComponent } from '../user/components/mentors.index/mentors.index.component';
import { UserDirective } from '../user/directives/user.directive';
import { MentorsAllUsersComponent } from '../user/components/mentors.all.users/mentors.all.users.component';
import { MentorsFromMentorComponent } from '../user/components/mentors.from.mentor/mentors.from.mentor.component';

/** Подключение классов представления mentor */
import { AppComponent } from './app.component';
import { MainWrapComponent } from '../mentor/components/mainWrap/main.wrap.component';
import { IndexComponent } from '../mentor/components/index/index.component';
import { PadawanComponent } from '../mentor/components/padawan/padawan.component';
import { PadawanMyUsersComponent } from '../mentor/components/my.users/padawan.my.users.component';
import { PadawanAllUserComponent } from '../mentor/components/all-users/padawan.all.user.component';
import { PadawanToMentorComponent } from '../mentor/components/to.mentor/padawan.to.mentor.component';
import { PadawanFromMentorComponent } from '../mentor/components/from.mentor/padawan.from.mentor.component';

/** Подключение класов представлений главной страницы */
import { IndexMainComponent } from '../index/components/main/index.main.component';
import { IndexLoginComponent } from '../index/components/login/index.login.component';
import { IndexRegistrationComponent } from '../index/components/registration/index.registration.component';

/** Импортируем общие класы представлений */
import { UserTypeDirective } from '../common/directives/user.type.directive';
import { PaginationDirective } from '../common/directives/pagination.directive';
import { PaginationComponent } from '../common/components/pagination/pagination.component';
import { SettingMainComponent } from '../for.all.users/components/setting.main.component/setting.main.component';
import { SettingCardComponent } from '../for.all.users/components/setting.card.component/setting.card.component';
import { SettingContactsComponent } from '../for.all.users/components/setting.contacts.component/setting.contacts.component';
import { SettingContactsItemComponent } from '../for.all.users/components/setting.contacts.item.component/setting.contacts.item.component';
import { UserPageComponent } from '../for.all.users/components/user.page.component/user.page.component';
import { UserPageAvatarComponent } from '../for.all.users/components/user.page.avatar.component/user.page.avatar.component';
import { UserPageMainBtnComponent } from '../for.all.users/components/user.page.main.btn.component/user.page.main.btn.component';
import {
    UserPageRelationUserComponent
} from '../for.all.users/components/user.page.relation.user.component/user.page.relation.user.component';
import { UserPageHeaderComponent } from '../for.all.users/components/user.page.header.component/user.page.header.component';
import { UserPageContactComponent } from '../for.all.users/components/user.page.contact.component/user.page.contact.component';
import { UserPageBasePostComponent } from '../for.all.users/components/user.page.base.post.component/user.page.base.post.component';
import { UserPageCreatePostComponent } from '../for.all.users/components/user.page.create.post.component/user.page.create.post.component';
import { UserPagePostsMainComponent } from '../for.all.users/components/user.page.posts.main.component/user.page.posts.main.component';
import { UserPagePostViewComponent } from '../for.all.users/components/user.page.post.view.component/user.page.post.view.component';
import { UserPagePostViewBaseComponent } from '../for.all.users/components/user.page.post.view.base.component/user.page.post.view.base.component';
import { MessageMainComponent } from '../for.all.users/components/message.main.component/message.main.component';
import { MessageTopicItemComponent } from '../for.all.users/components/message.topic.item.component/message.topic.item.component';
import { MessageRoomComponent } from '../for.all.users/components/message.room.component/message.room.component';
import { MessageWrapperComponent } from '../for.all.users/components/message.wrapper.component/message.wrapper.component';
import { MessageRoomItemComponent } from '../for.all.users/components/message.room.item.component/message.room.item.component';
import { MessageRoomHeaderComponent } from '../for.all.users/components/message.room.header.component/message.room.header.component';
import { UserViewComponent } from '../mentor/components/user.view.component/user.view.component';
import { UsersIndexComponent } from '../mentor/components/users.index.component/users.index.component';


/** Импортируем роуты */
import { mainRoutes as mentorRoutes } from '../mentor/routes';
import { indexRoutes } from '../index/routes';
import { userMainRoutes } from '../user/routes';

const parentRoute: Routes = [
    {path: '', component: IndexMainComponent, children: indexRoutes},
    {path: 'mentor', component: MainWrapComponent, children: mentorRoutes},
    {path: 'user', component: MainWrapComponent /* UserMainComponent */, children: userMainRoutes}
];

/** Импортируем глобальные провайдеры */
import { AuthorizationService } from '../index/services/authorization.service';
import { UrlService } from '../common/url.service';
import { LogService } from '../common/log.service';
import { UserManagerService } from '../common/user.manager.service';
import { StoreService } from '../common/store.service';
import { CacheService } from '../common/cache.service';
import { MentorService } from '../mentor/services/mentor.service';
import { UserService } from '../user/services/user.service';
import { UserCacheService } from '../user/services/user.cache.service';
import { MentorCacheService } from '../mentor/services/mentor.cache.service';
import { TrainingPlanService } from '../training/services/training.plan.service';
import { MicrocicleService } from '../training/services/microcicle.service';
import { CommentService } from '../training/services/comment.service';
import { TrainingPlanChartService } from '../chart/services/training.plan.chart.service';
import { LayoutExerciseChartService } from '../chart/services/layout.exercise.chart.service';
import { ExecuteTrainingService } from '../training/services/execute.training.service';
import { TrainingService } from '../training/services/training.service';
import { ExerciseService } from '../training/services/exercise.service';
import { BurdenCalcService } from '../training/services/burden.calc.service';
import { LabelService } from '../common/label.service';

/** Импортируем базовые классы */
import { ProtectedComponent } from '../common/components/protected.component';
import {ImageService} from '../common/image.service';
import {ListingTrainingPlansViewComponent} from '../training/components/listing.training.plans.view/listing.training.plans.view.component';
import {AppService} from '../common/app.service';
import {LoadItemComponent} from '../for.all.users/components/load.item.component/load.item.component';
import {UserManipulateBaseComponent} from '../mentor/components/user.manipulate/user.manipulate.base.component';

@NgModule({
  declarations: [
      /** Декларирование базовых классов */
      ProtectedComponent,
      UsersIndexComponent,
      UserManipulateBaseComponent,

      /** Декларация класов представления главной страницы */
      IndexMainComponent,
      IndexLoginComponent,
      IndexRegistrationComponent,

      /** Декларация класов представлений модуля mentor */
      AppComponent,
      MainWrapComponent,
      IndexComponent,
      PadawanComponent,
      PadawanMyUsersComponent,
      PadawanAllUserComponent,
      PadawanToMentorComponent,
      PadawanFromMentorComponent,

      /** Декларация класов представлений модуля user */
      UserMainComponent,
      UserIndexComponent,
      UserMentorsComponent,
      MentorsIndexComponent,
      UserDirective,
      MentorsAllUsersComponent,
      MentorsFromMentorComponent,

      /** Декларирование класов представлений training */
      TrainingIndexComponent,
      ListingTrainingPlansComponent,
      TrainingPlanItemComponent,
      RatingDirective,
      TrainingPlanCreateComponent,
      ExerciseItemComponent,
      TrainingPlanViewIndexComponent,
      TrainingPlanViewCommentComponent,
      TrainingPlanViewComponent,
      TrainingMicrocicleComponent,
      PlanItemComponent,
      PlanCommentComponent,
      PlanCommentAddComponent,
      ChartComponent,
      TrainingPlanChartComponent,
      GroupMarkDirective,
      TrainingExerciseChartComponent,
      ListingTrainingPlansIndexComponent,
      SearchTrainingPlansComponent,
      CurrentTrainingPlanComponent,
      ListingCompletedPlansComponent,
      CompleteTrainingPlanComponent,
      TrainingItemComponent,
      ExerciseItemDirective,
      PadawanTrainingPlanViewComponent,

      /** Декларирование общих класов представлений */
      UserTypeDirective,
      PaginationDirective,
      PaginationComponent,
      SettingMainComponent,
      SettingCardComponent,
      SettingContactsComponent,
      SettingContactsItemComponent,
      UserPageComponent,
      UserPageAvatarComponent,
      UserPageMainBtnComponent,
      UserPageRelationUserComponent,
      UserPageHeaderComponent,
      UserPageContactComponent,
      UserPageBasePostComponent,
      UserPageCreatePostComponent,
      UserPagePostsMainComponent,
      UserPagePostViewComponent,
      UserPagePostViewBaseComponent,
      MessageMainComponent,
      MessageTopicItemComponent,
      MessageRoomComponent,
      MessageWrapperComponent,
      MessageRoomItemComponent,
      MessageRoomHeaderComponent,
      UserViewComponent,
      ListingTrainingPlansViewComponent,
      LoadItemComponent
  ],
  imports: [
      BrowserModule,
      BrowserAnimationsModule,
      HttpClientModule,
      FormsModule,
      RouterModule.forRoot(parentRoute),
      SuiModule
  ],
  providers: [
      UserManagerService,
      StoreService,
      CacheService,
      AuthorizationService,
      UrlService,
      LogService,
      MicrocicleService,
      /** Сервисы отправляющие HTTP запросы */
      MentorService,
      UserService,
      ExecuteTrainingService,
      TrainingService,
      ExerciseService,
      BurdenCalcService,
      /** Кэширующие сервисы(возможно в будущем будут перерабытваться/изменяться) */
      UserCacheService,
      MentorCacheService,
      TrainingPlanService,
      CommentService,
      /** Сревисы графиков */
      TrainingPlanChartService,
      LayoutExerciseChartService,
      {provide: 'Window', useValue: window},
      /** Служебные сервисы(for admin) */
      LabelService,
      ImageService,
      AppService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
