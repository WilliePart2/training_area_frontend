import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { take } from 'rxjs/operator/take';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { PadawanService } from '../../services/padawan.service';
import { MentorService } from '../../services/mentor.service';
import { MentorCacheService } from '../../services/mentor.cache.service';
import { LogService } from '../../../common/log.service';
import { User } from '../../../common/models/user';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import {UserManipulateBaseComponent} from '../user.manipulate/user.manipulate.base.component';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {ScrollActionModel} from '../../../common/models/action.model';
import {UserCommonLabels} from '../../../common/models/user.common.labels';
import {ExtendedUserModel} from '../../../common/models/user.base.model';

@Component({
    selector: 'app-padawan-my-user',
    templateUrl: './padawan.my.user.component.html'
})

export class PadawanMyUsersComponent extends UserManipulateBaseComponent implements OnInit, OnDestroy {
    padawans: ExtendedUserModel[];

    scrollSub: Subscription;
    loadProcess: boolean;
    emptyLock: boolean;
    emptyLockTyme: number;

    _commonLabels: UserCommonLabels;
    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    constructor(
        protected userManager: UserManagerService,
        private padawan: PadawanService,
        private logService: LogService,
        private mentorService: MentorService,
        private mentorCache: MentorCacheService,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        super.ngOnInit();
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._commonLabels = labels[LABEL_GROUP_NAMES.USER_COMMON_LABELS];

        this.emptyLockTyme = 60 * 1000;

        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        const _tmpSub = new Subject();
        /**
         * observer for first initialize
         */
        _tmpSub.take(1).subscribe(response => {
            this.disableDimmer();
            if (response && !response['result']) {
                this.emptyDataMessage(this._commonLabels.USER_EMPTY_DATA);
                this.setEmptyLock();
            }
        }, _ => {
            this.disableDimmer();
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
        });
        /**
         * observer for starting watch on scroll
         */
        _tmpSub.take(1).subscribe(() => {
            this.scrollSub = this.getObservableScroll().subscribe((action: ScrollActionModel) => {
                if (this.loadProcess || this.emptyLock) { return; }
                this.enableLoadProcess();
                this.correctOffset(true);
                this.initialize(this.offset, this.limit).take(1).subscribe(response => {
                    setTimeout(() => this.disableLoadProcess());
                    if (response && (!response.padawans || !response.padawans.length)) {
                        this.setEmptyLock();
                    }
                }, error => {
                    setTimeout(() => this.disableLoadProcess());
                    this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                    this.setEmptyLock();
                });
            });
        }, error => {});
        /**
         * execute fetching users
         */
        this.initialize(this.offset, this.limit).take(1).subscribe(_tmpSub);
    }

    ngOnDestroy() {
        if (this.scrollSub) { this.scrollSub.unsubscribe(); }
    }

    initialize(offset: number, limit: number) {
        return Observable.create(observer => {
            this.padawan.getOwnPadawanList(offset, limit).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.addUsers(resp['padawans']);
                });
                observer.next(response);
            }, error => {
                observer.error();
            });
        });
    }

    addUsers(users: ExtendedUserModel[]) {
        if (this.padawans) {
            this.padawans = [
                ...this.padawans,
                ...users.filter(newUser =>
                    !this.padawans.find(oldUser => oldUser.id === newUser.id)
                )
            ];
        } else {
            this.padawans = users;
        }
    }
    
    /**
     * discard learner
     */
    rejectLearner(learnerId: number) {
        this.enableUserDimmer(learnerId);
        this.mentorService.removeOwnLearner(learnerId).subscribe(response => {
            this.checkResponse(response, resp => {
                this.padawans = this.padawans.filter(pItem => pItem.id !== learnerId);
            });
            if (response && !response.result) {
                this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
            }
            this.disableUserDimmer(learnerId);
        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
            this.disableUserDimmer(learnerId);
        });
    }

    enableLoadProcess() {
        this.loadProcess = true;
    }
    disableLoadProcess() {
        this.loadProcess = false;
    }

    setEmptyLock() {
        this.emptyLock = true;
        setTimeout(() => this.emptyLock = false, this.emptyLockTyme);
    }
}

