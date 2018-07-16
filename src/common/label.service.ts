/**
 * Сервис в будет получать значения надписей с сервера и заменять ими стандартные надписи
 */
import { Injectable } from '@angular/core';

import * as _mlgn from './models/label.group.names';
import { LABEL_GROUP_NAMES } from './models/label.group.names';
import { PostViewActionLabels } from './models/post.view.action.label.model';
import { PostViewCommonIcons } from './models/post.view.common.icons.model';
import { PostViewPopupLabels } from './models/post.view.popup.labels.model';
import { PostViewCommonLabels } from './models/post.view.common.labels.model';
import { DimmerLabels } from './models/dimmer.labels.model';
import { ErrorLabelsModel } from './models/error.labels.model';
import { MenuLabelsModel } from './models/menu.labels.model';
import { MessagePopupLabels } from './models/message.popup.labels';
import { MessageCommonLabels } from './models/message.common.labels';
import { MessageCommonIcons } from './models/message.common.icons';
import { CommonLabels } from './models/common.labels';
import { MessageActionLabels } from './models/message.action.labels';
import { MessageDateLabels } from './models/message.date.labels';
import { TrainingCommonLabels } from './models/training.common.labels';
import { TrainingActionLabels } from './models/training.action.labels';
import { TrainingMessageLabels } from './models/training.message.labels';
import { PadawanCommonLabels } from './models/padawans.common.labels';
import {LoginCommonLabels } from './models/login.common.labels';
import {RegistrationCommonLabels} from './models/registration.common.labels';
import {UserCommonLabels} from './models/user.common.labels';
import {UserMessageLabels} from './models/user.message.labels.model';

type _PostViewActionLabels = LABEL_GROUP_NAMES.POST_VIEW_ACTIONS_LABELS;

@Injectable()
export class LabelService {
    $core: { [k: string]: {[vk: string]: string} } | any;
    stdLabels: {
        [k: string]: PostViewActionLabels |
                    PostViewCommonIcons |
                    PostViewPopupLabels |
                    PostViewCommonLabels |
                    DimmerLabels |
                    ErrorLabelsModel |
                    MenuLabelsModel |
                    MessagePopupLabels |
                    MessageCommonLabels |
                    MessageCommonIcons |
                    CommonLabels |
                    MessageActionLabels |
                    MessageDateLabels |
                    TrainingCommonLabels |
                    TrainingActionLabels |
                    TrainingMessageLabels |
                    PadawanCommonLabels |
                    LoginCommonLabels |
                    UserCommonLabels |
                    UserMessageLabels
    };
    constructor() {
        this.$core = {} as any;
        this.stdLabels = {} as any;
        this.stdLabels[LABEL_GROUP_NAMES.POST_VIEW_ACTIONS_LABELS] = new PostViewActionLabels();
        this.stdLabels[LABEL_GROUP_NAMES.POST_VIEW_COMMON_ICONS] = new PostViewCommonIcons();
        this.stdLabels[LABEL_GROUP_NAMES.POST_VIEW_POPUP_LABELS] = new PostViewPopupLabels();
        this.stdLabels[LABEL_GROUP_NAMES.POST_VIEW_COMMON_LABELS] = new PostViewCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.DIMMER_LABELS] = new DimmerLabels();
        this.stdLabels[LABEL_GROUP_NAMES.ERROR_LABELS] = new ErrorLabelsModel();
        this.stdLabels[LABEL_GROUP_NAMES.MENU_LABELS] = new MenuLabelsModel();
        this.stdLabels[LABEL_GROUP_NAMES.MESSAGE_POPUP_LABELS] = new MessagePopupLabels();
        this.stdLabels[LABEL_GROUP_NAMES.MESSAGE_COMMON_LABELS] = new MessageCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.MESSAGE_COMMON_ICONS] = new MessageCommonIcons();
        this.stdLabels[LABEL_GROUP_NAMES.COMMON_LABELS] = new CommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.MESSAGE_ACTION_LABELS] = new MessageActionLabels();
        this.stdLabels[LABEL_GROUP_NAMES.MESSAGE_DATE_LABELS] = new MessageDateLabels();
        this.stdLabels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS] = new TrainingCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.TRAINING_ACTION_LABLES] = new TrainingActionLabels();
        this.stdLabels[LABEL_GROUP_NAMES.TRAINING_MESSAGE_LABELS] = new TrainingMessageLabels();
        this.stdLabels[LABEL_GROUP_NAMES.PADAWAN_COMMON_LABELS] = new PadawanCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.LOGIN_COMMON_LABELS] = new LoginCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.REGISTRATION_COMMON_LABELS] = new RegistrationCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.USER_COMMON_LABELS] = new UserCommonLabels();
        this.stdLabels[LABEL_GROUP_NAMES.USER_MESSAGE_LABELS] = new UserMessageLabels();
    }
    setLabels(key: string, values: {[k: string]: string}) {
        this.$core[key] = values;
    }
    mergeLabels(key: string, values: {[k: string]: string}) {
        this.$core[key] = Object.assign(this.$core[key], values);
    }
    getLabels() {
        return Object.assign(this.$core, this.stdLabels);
    }
}
