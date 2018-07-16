import {Component, OnInit, Input, Output, EventEmitter, ViewChild, TemplateRef} from '@angular/core';
import { trigger, transition, style, state, animate } from '@angular/animations';
import { UserManagerService } from '../../../common/user.manager.service';
import { ExtendedUserModel } from '../../../common/models/user.base.model';
import { ImageService } from '../../../common/image.service';
import { LabelService } from '../../../common/label.service';
import { ModalTemplate, TemplateModalConfig, SuiModalService} from 'ng2-semantic-ui';
import { TrainingPlanService } from '../../../training/services/training.plan.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { UserCommonLabels } from '../../../common/models/user.common.labels';
import {TrainingCommonLabels} from '../../../common/models/training.common.labels';
import {IPadawanTrainingPlan} from '../../models/padawan.model';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ActionModel} from '../../../common/models/action.model';
import { UserViewActions } from '../../models/user.view.actions';

interface ITpListContext {
    header: string;
    listing: IPadawanTrainingPlan [];
}

class ModeTypes {
    constructor(
        public request = 'request',
        public view = 'view',
        public own = 'own',
        public invite = 'invite'
    ) {}
}

@Component({
    selector: 'app-user-view',
    templateUrl: './user.view.component.html',
    styleUrls: ['./user.view.component.css'],
    animations: [
        trigger('showDetail', [
            transition('void => *', [
                style({
                    opacity: 0,
                    height: 0
                }),
                animate('300ms', style({
                        opacity: 1,
                        height: '*'
                    })
                )
            ])
        ]),
        trigger('dopInfo', [
            state('false', style({
                height: 0,
                opacity: 0
            })),
            state('true', style({
                height: '*',
                opacity: 1
            })),
            transition('false => true', [
                style({
                    height: 0,
                    opacity: 0
                }),
                animate('300ms', style({
                    height: '*',
                    opacity: 1
                }))
            ]),
            transition('true => false', [
                style({
                    height: '*',
                    opacity: 1
                }),
                animate('300ms', style({
                    height: 0,
                    opacity: 0
                }))
            ])
        ])
    ]
})

export class UserViewComponent implements OnInit {
    @Output() inviteRequest = new EventEmitter<number>();
    @Output() sendMessage = new EventEmitter<number>();
    @Output() accept = new EventEmitter<number>();
    @Output() reject = new EventEmitter<number>();
    @Input() parentObs: Observable<any>;
    @Input('userData') user: ExtendedUserModel;
    @Input() permission: boolean;
    @Input() mode: keyof ModeTypes;
    _modeTypes: ModeTypes;
    @ViewChild('trainingPlansList') tpListModal: ModalTemplate<ITpListContext, any, any>;
    showDetail: boolean;
    columnsForList: {
        [k: string]: any
    };
    currentUserType: 'mentor' | 'user';
    
    dimmed: boolean;
    
    parentObsSub: Subscription;

    _commonLabels: UserCommonLabels;
    _trainingCommonLabels: TrainingCommonLabels;
    
    constructor(
        private imageManager: ImageService,
        public labelService: LabelService,
        private userManager: UserManagerService,
        private modalService: SuiModalService,
        private tpService: TrainingPlanService
    ) { }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.USER_COMMON_LABELS];
        this._trainingCommonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];

        this.columnsForList = {
            [this._trainingCommonLabels.LIST_TP_NAME_LABEL]: 'name',
            [this._trainingCommonLabels.LIST_TP_CATEGORY_LABEL]: 'category',
            [this._trainingCommonLabels.LIST_TP_RATING_LABEL]: 'rating'
        };

        this.showDetail = false;

        if (this.parentObs) {
            this.parentObsSub = this.parentObs.subscribe((action: ActionModel) => {
                if (!action.data || action.data !== this.user.id) {
                    return;
                }
                switch (action.type) {
                    case UserViewActions.SHOW_DIMMER:
                        this.enableDimmer();
                        break;
                    case UserViewActions.HIDE_DIMMER:
                        this.disableDimmer();
                        break;
                }
            });
        }

        this.currentUserType = this.userManager.type;
        this._modeTypes = new ModeTypes();
    }
    goToUserPage() {
        this.userManager.redirectUser(`${this.userManager.type}/user-page`, {id: this.user.id});
    }
    getStrongImage() {
        return this.imageManager.getImagePath('strong');
    }
    getCurrentTrainingPlanIcon() {
        return this.imageManager.getImagePath('current_training_plan');
    }
    getOwnTrainingPlansIcon() {
        return this.imageManager.getImagePath('own_training_plan');
    }
    getOwnPadawansIcon() {
        return this.imageManager.getImagePath('own_padawans');
    }
    getSendMessageIcon() {
        return this.imageManager.getImagePath('send_message');
    }
    getAddUserIcon() {
        return this.imageManager.getImagePath('add_user');
    }
    getAcceptIcon() {
        return this.imageManager.getImagePath('accept_user');
    }
    getAcceptDescription() {
        if (this.userManager.type === UserManagerService.MENTOR) {
            return this._commonLabels.ACCEPT_LEARNER;
        }
        return this._commonLabels.ACCEPT_MENTOR;
    }
    getRejectIcon() {
        return this.imageManager.getImagePath('reject_user');
    }
    getDividerIcon() {
        return this.imageManager.getImagePath('vertical_scratch');
    }
    getRejectDescription() {
        if (this.userManager.type === UserManagerService.MENTOR) {
            switch (this.mode) {
                case this._modeTypes.request: return this._commonLabels.REJECT_USER;
                case this._modeTypes.invite: return this._commonLabels.CANCEL_USER;
                case this._modeTypes.own: return this._commonLabels.DROP_LEARNER;
            }
        } else {
            switch (this.mode) {
                case this._modeTypes.request: return this._commonLabels.REJECT_USER;
                case this._modeTypes.invite: return this._commonLabels.CANCEL_USER;
                case this._modeTypes.own: return this._commonLabels.DROP_MENTOR;
            }
        }
    }
    viewTrainingPlans(listType: 'completed' | 'own') {
        const config = new  TemplateModalConfig<ITpListContext, any, any>(this.tpListModal);
        switch (listType) {
            case 'completed' : {
                config.context = {
                    header: this._commonLabels.TP_LIST_MODAL_HEADER_COMPLETED_PLANS,
                    listing: this.user.trainings.completedPlans.map(item => {
                        return {
                            ...item,
                            category: this.tpService.getReadableCategoryValue(item.category as number)
                        };
                    })
                };
            } break;
            case 'own': {
                config.context = {
                    header: this._commonLabels.TP_LIST_MODAL_HEADER_OWN_PLANS,
                    listing: this.user.trainings.ownPlans.map(item => {
                        return {
                            ...item,
                            category: this.tpService.getReadableCategoryValue(item.category as number)
                        };
                    })
                };
            } break;
        }
        this.modalService.open(config)
            .onApprove(() => {})
            .onDeny(() => {});
    }
    goToTrainingPlan(id: number, callback?: Function) {
        this.userManager.toTrainingPlan(id);
        if (callback !== undefined) {
            callback();
        }
    }
    sendInviteRequest(userId: number) {
        this.inviteRequest.emit(userId);
    }
    sendMessageToUser(userId: number) {
        this.sendMessage.emit(userId);
    }
    acceptEvent() {
        this.accept.emit(this.user.id);
    }
    rejectEvent() {
        this.reject.emit(this.user.id);
    }
    enableDimmer() {
        this.dimmed = true;
    }
    disableDimmer() {
        this.dimmed = false;
    }
}
