import {Component, OnInit, AfterContentChecked, TemplateRef, OnDestroy, Inject, NgZone} from '@angular/core';
import { trigger, transition, animate, style } from '@angular/animations';
import { Observable } from 'rxjs/Observable';
import { take } from 'rxjs/operator/take';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { CacheService } from '../../../common/cache.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { PadawanService } from '../../services/padawan.service';
import { MentorService } from '../../services/mentor.service';
import { MentorCacheService } from '../../services/mentor.cache.service';
import { LogService } from '../../../common/log.service';
import { User } from '../../../common/models/user';
import { LabelService } from '../../../common/label.service';
import {Subscription} from 'rxjs/Subscription';
import {fromEvent} from 'rxjs/observable/fromEvent';
import {Observer} from 'rxjs/Observer';
import {Subject} from 'rxjs/Subject';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { PadawanCommonLabels } from '../../../common/models/padawans.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import {ExtendedUserModel} from '../../../common/models/user.base.model';
import { UserViewActions } from '../../models/user.view.actions';
import {TotalMessageService} from '../../../for.all.users/services/total.message.service';
import {UserMessageLabels} from '../../../common/models/user.message.labels.model';
import {UserService} from '../../../user/services/user.service';
import {UserManipulateBaseComponent} from '../user.manipulate/user.manipulate.base.component';

@Component({
    selector: 'app-padawan-all-users',
    templateUrl: './padawan.all.user.component.html',
    providers: [
        {provide: 'Window', useValue: window}
    ],
    animations: [
        trigger('appear', [
            transition('void => *', [
                style({
                    height: 0,
                    opacity: 0
                }),
                animate('500ms', style({
                    height: '*',
                    opacity: 1
                }))
            ])
        ]),
        trigger('leave', [
            transition('* => void', [
                style({
                    height: '*',
                    opacity: 1
                }),
                animate('500ms', style({
                    height: 0,
                    opacity: 0
                }))
            ])
        ])
    ]
})

export class PadawanAllUserComponent extends UserManipulateBaseComponent implements OnInit, OnDestroy {
    init: boolean;

    users: ExtendedUserModel [] = [];
    username: string;
    type: string;

    emptyLock: boolean;
    emptyLockTime: number;
    loadPerforming: boolean;
    minimalGapToLoadNewUsers: number;
    scrollSub: Subscription;

    configObserver: Observer<any>;

    _commonLabels: PadawanCommonLabels;
    _messageLabels: UserMessageLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        protected userManager: UserManagerService,
        private padawan: PadawanService,
        private loger: LogService,
        private cache: CacheService,
        private mentor: MentorService,
        private userService: UserService,
        private mentorCache: MentorCacheService,
        private labelService: LabelService,
        private zone: NgZone,
        private messageManager: TotalMessageService,
        @Inject('Window') private _window
    ) {
        super(userManager);
        this.username = this.userManager.username;
        this.type = this.userManager.type;
        
        this.step = 20;
        this.limit = this.step;
        /** Это походу что то кэширующее */
        // if (this.mentor.ownPadawans) { this.ownPadawans = this.mentor.ownPadawans; }
        /** Иницыализация свойств пагинации */
        // this.limit = this.step;
    }

    ngOnInit() {
        this.minimalGapToLoadNewUsers = 100;
        this.emptyLockTime = 1000 * 60;

        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.USER_COMMON_LABELS];
        this._messageLabels = labels[LABEL_GROUP_NAMES.USER_MESSAGE_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.fetchAllUsers().take(1).subscribe((users: ExtendedUserModel[]) => {
            this.users = this.filterUsers(users);
            this.disableDimmer();

            let startTime;
            const minDuration = 500;
            this.loadPerforming = false;
            this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(() => {
                this.scrollSub = fromEvent(this._window, 'scroll').subscribe(() => {
                    if (this.loadPerforming || this.emptyLock) { return; }
                    const viewHeight = document.documentElement.clientHeight;
                    const contentHeight = Math.max(
                        document.documentElement.clientHeight, document.body.clientHeight,
                        document.documentElement.offsetHeight, document.body.offsetHeight,
                        document.documentElement.scrollHeight, document.body.scrollHeight
                    );
                    const offset = pageYOffset || document.documentElement.scrollTop;
                    
                    if (contentHeight - (viewHeight + offset) < this.minimalGapToLoadNewUsers) {
                        this.loadPerforming = true;
                        startTime = Date.now();
                        this.correctOffset();
                        this.fetchAllUsers().take(1).subscribe((_users: ExtendedUserModel[]) => {
                            if (this.users) {
                                this.users = [
                                    ...this.users,
                                    ...this.filterUsers(_users).filter(newUser =>
                                        !this.users.find(exUser => exUser.id === newUser.id)
                                    )
                                ];
                            } else {
                                this.users = this.filterUsers(_users);
                            }

                            setTimeout(() => this.loadPerforming = false, (() => {
                                const timeToEnd = Date.now() - startTime;
                                return timeToEnd > minDuration ? 0 : timeToEnd;
                            })());
                        });
                    }
                });
            });

        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
            this.disableDimmer();
        });

        super.ngOnInit();
    }


    ngOnDestroy() {
        if (this.scrollSub) { this.scrollSub.unsubscribe(); }
        if (this.configObserver) { this.configObserver = null; }
        super.ngOnDestroy();
    }

    /** Метод получения списка пользователей */
    fetchAllUsers() {
        return Observable.create(observer => {
            this.padawan.getAllUsersList(this.offset, this.limit).subscribe((response: User[] | ExtendedUserModel[]) => {
                if (!response || !response['data']) {
                    this.setEmptyLock();
                    return;
                }
                if (response && response['data'] && !response['data'].length) {
                    this.setEmptyLock();
                }
                if (response['totalCount']) {
                    this.totalCount = response['totalCount'];
                }
                observer.next(response['data']);
            }, error => {
                observer.error(error);
            });
        });
    }

    /**
     * Метод отправляет запрос на связывание ментора с пользователем
     */
    bindRequest(userId: number) {
        const methodName = this.userManager.type === UserManagerService.MENTOR ? 'sendBindingRequestAsMentor' : 'sendBindingRequestAsUser';
        this.enableUserDimmer(userId);
        this[methodName](userId).take(1).subscribe(() => {
            this.users = this.users.filter(userItem => userItem.id !== userId);
            this.messageManager.sendSuccessMessage(this._messageLabels.SUCCESS_INVITED_USER);
            this.disableUserDimmer(userId);
        }, () => {
            this.disableUserDimmer(userId);
            this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
        });
    }

    sendBindingRequestAsMentor(userId: number /* User */) {
        return Observable.create(observer => {
            this.mentor.sendBindRequest(userId).subscribe(response => {
                this.checkResponse(response, resp => {
                    observer.next();
                    observer.complete();
                });
                observer.error();
            }, error => {
                observer.error();
            });
        });
    }

    sendBindingRequestAsUser(mentorId: number) {
        return Observable.create(observer => {
            this.userService.sendBindingRequest(mentorId).subscribe(response => {
                this.checkResponse(response, resp => {
                    observer.next();
                    observer.complete();
                });
                observer.error();
            }, error => {
                observer.error();
            });
        });
    }

    sendMessageToUser(userId: number) {
        
    }

    /** Хэлперы */
    /** хэлпер фильтрует вывод пользователей и не выводит тех кому отправлена заявка на привязку */
    filterUsers(users: ExtendedUserModel[]) {
        if (!users || !users.length) {
            return [];
        }
        const results = [];
        (<ExtendedUserModel[]>users).forEach(item => {
            let hasMatch = false;
            if (this.type === 'mentor') {
                /** Фильтрация по приглашенным пользователям */
                if (this.mentorCache.inviteLearners) {
                    this.mentorCache.inviteLearners.forEach(fromMentorItem => {
                        if (!hasMatch && fromMentorItem.username === item.username) {
                            hasMatch = true;
                            return;
                        }
                    });
                }
                /** Фильрация по собственным пользователям */
                if (this.mentorCache.ownLearners) {
                    this.mentorCache.ownLearners.forEach(ownLearnerItem => {
                        if (ownLearnerItem.username === item.username) {
                            hasMatch = true;
                            return;
                        }
                    });
                }
                /** Фильтрация по пользователям приславшим запрос */
                if (this.mentorCache.incomingLearners) {
                    this.mentorCache.incomingLearners.forEach(incomingLearnerItem => {
                        if (incomingLearnerItem.username === item.username) {
                            hasMatch = true;
                            return;
                        }
                    });
                }
            } else {
                
            }
            if (hasMatch) { return; }
            results.push(item);
        });
        return results;
    }
    setEmptyLock() {
        this.emptyLock = true;
        setTimeout(() => this.emptyLock = false, this.emptyLockTime);
    }
    correctOffset() {
        this._page = this._page + 1;
        super.correctOffset();
    }
    // enableDimmerInUserItem(userId: number) {
    //     if (!this.configObserver) { return; }
    //     this.configObserver.next({
    //         type: UserViewActions.SHOW_DIMMER,
    //         data: userId
    //     });
    // }
    // disableDimmerInUserItem(userId: number) {
    //     if (!this.configObserver) { return; }
    //     this.configObserver.next({
    //         type: UserViewActions.HIDE_DIMMER,
    //         data: userId
    //     });
    // }
}
