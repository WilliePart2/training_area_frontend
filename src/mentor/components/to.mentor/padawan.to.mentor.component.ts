import {Component, OnDestroy, OnInit} from '@angular/core';
import {ProtectedComponent} from '../../../common/components/protected.component';
import {MentorService} from '../../services/mentor.service';
import {UserManagerService} from '../../../common/user.manager.service';
import {PadawanService} from '../../services/padawan.service';
import {MentorCacheService} from '../../services/mentor.cache.service';
import {LabelService} from '../../../common/label.service';

import {ExtendedUserModel} from '../../../common/models/user.base.model';
import {LABEL_GROUP_NAMES} from '../../../common/models/label.group.names';
import {ErrorLabelsModel} from '../../../common/models/error.labels.model';
import {DimmerLabels} from '../../../common/models/dimmer.labels.model';
import {UserManipulateBaseComponent} from '../user.manipulate/user.manipulate.base.component';
import {UserService} from '../../../user/services/user.service';
import {TotalMessageService} from '../../../for.all.users/services/total.message.service';
import {UserMessageLabels} from '../../../common/models/user.message.labels.model';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ActionModel} from '../../../common/models/action.model';
import {UserCommonLabels} from '../../../common/models/user.common.labels';

@Component({
    selector: 'app-padawan-to-mentor',
    templateUrl: './padawan.to.mentor.component.html'
})
export class PadawanToMentorComponent extends UserManipulateBaseComponent implements OnInit, OnDestroy {
    users: ExtendedUserModel[] /* User [] */;

    scrollSub: Subscription;

    loadProcess: boolean;
    emptyLock: boolean;
    emptyLockTyme: number;

    _commonLabels: UserCommonLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;
    _messageLabels: UserMessageLabels;

    constructor(
        private mentor: MentorService,
        private user: UserService,
        protected userManager: UserManagerService,
        private padawanService: PadawanService,
        private mentorCache: MentorCacheService,
        private labelService: LabelService,
        private messageService: TotalMessageService
    ) {
        super(userManager);
        this.limit  = 10;
        this.step = this.limit;
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._messageLabels = labels[LABEL_GROUP_NAMES.USER_MESSAGE_LABELS];
        this._commonLabels = labels[LABEL_GROUP_NAMES.USER_COMMON_LABELS];

        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.initialize(this.offset, this.limit).subscribe(response => {
            this.disableDimmer();
            if (response && !response.result) {
                this.emptyDataMessage(this._commonLabels.USER_EMPTY_REQUEST);
            }
        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
            this.disableDimmer();
        });

        setTimeout(() => {
            super.ngOnInit();
            this.emptyLockTyme = 60 * 1000;
            this.scrollSub = this.getObservableScroll().subscribe((scrollAction: ActionModel) => {
               if (this.loadProcess || this.emptyLock) { return; }
               this.enableLoadProcess();
               this.correctOffset(true);
               this.initialize(this.offset, this.limit).subscribe(response => {
                   this.checkResponse(response, resp => {});
                   if (!response || !response.result) {
                       this.setEmptyLock();
                   }
                   this.disableLoadProcess();
               },  error => {
                   this.setEmptyLock();
                   this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                   this.disableLoadProcess();
               });
            });
        });
    }

    ngOnDestroy() {
        if (this.scrollSub) { this.scrollSub.unsubscribe(); }
        super.ngOnDestroy();
    }

    initialize(offset: number, limit: number) {
        let service;
        let method;
        if  (this.userManager.type === UserManagerService.MENTOR) {
            service = 'padawanService';
            method = 'getRequestToMentor';
        } else {
            service = 'user';
            method = 'fetchRequestFromMentor';
        }
        return Observable.create(observer => {
            this[service][method](offset, limit).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.addUsers(resp['data']);
                });
                observer.next(response);
            }, error => {
                observer.error();
            });
        });
    }

    handlePadawan(userId: number, answer: boolean) {
        return Observable.create(observer => {
            this.mentor.handlePadawan(userId, answer).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.users = this.users.filter(userItem => userItem.id !== userId);
                    if (answer) {
                        this.messageService.sendSuccessMessage(this._messageLabels.ACCEPT_LEARNER);
                    }
                });
                observer.next(response);
            }, error => {
                observer.error();
            });
        });
    }

    handleMentor(userId: number, answer: boolean) {
        return Observable.create(observer => {
            this.user.answerToMentorHandler(userId, answer).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.users = this.users.filter(userItem => userItem.id !== userId);
                    if (answer) {
                        this.messageService.sendSuccessMessage(this._messageLabels.ACCEPT_MENTOR);
                    }
                });
                observer.next(response);
            }, error => {
                observer.error();
            });
        });
    }

    manageUser(userId: number, type: 'acceptUser' | 'rejectUser') {
        const method = this.userManager.type === UserManagerService.MENTOR ? 'handlePadawan' : 'handleMentor';
        const answer = type === 'acceptUser';
        this.enableUserDimmer(userId);
        this[method](userId, answer).subscribe(response => {
            this.disableUserDimmer(userId);
            if (response && !response.result) {
                this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
            }
        }, error => {
            this.disableUserDimmer(userId);
            this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
        });
    }

    setEmptyLock() {
        this.emptyLock = true;
        setTimeout(() => this.emptyLock = false, this.emptyLockTyme);
    }

    enableLoadProcess() {
        this.loadProcess = true;
    }
    disableLoadProcess() {
        this.loadProcess = false;
    }

    addUsers(users: ExtendedUserModel[]) {
        if (this.users) {
            this.users = [
                ...this.users,
                ...users.filter(newUser =>
                    !this.users.find(oldUser => oldUser.id === newUser.id)
                )
            ];
        } else {
            this.users = users;
        }
    }
}
