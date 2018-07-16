import { Component, OnInit } from '@angular/core';
import * as Immutable from 'immutable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanService } from '../../services/training.plan.service';
import {UsersPlanDataModel} from '../../models/users.plan.data.model';
import {CompletedMicrocicleModel, CompletedTrainingModel} from '../../models/completed.data.models';
import { IListPlansForPerformModel } from '../../models/plan.for.perform.model';
import { LabelService } from '../../../common/label.service';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';

@Component({
    selector: 'current-training-plan',
    templateUrl: './current.training.plan.component.html'
})

export class CurrentTrainingPlanComponent extends ProtectedComponent  implements OnInit {
    _emptyDataMessage: string;

    currentPlanId: number;
    trainingSessionId: number; /** id тренировочной сесии для идентификации пользователских раскладок */
    completedMicrocicles: CompletedMicrocicleModel [];
    completedTrainings: CompletedTrainingModel [];
    completedExercisePlans: IListPlansForPerformModel;
    mode = 'own';

    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;
    _commonLabels: TrainingCommonLabels;

    constructor(
        protected userManager: UserManagerService,
        private planService: TrainingPlanService,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._emptyDataMessage = this._commonLabels.TP_NOT_APPOINTED;

        this.loadTrainingPlan();
    }
    loadTrainingPlan() {
        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.planService.loadCurrentTrainingPlan().subscribe(response => {
            this.checkResponse(response, this.loadTrainingPlanHandler.bind(this));
        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
            this.disableDimmer();
        });
    }
    loadTrainingPlanHandler(response) {
        this.disableDimmer();
        this.currentPlanId = response['data']['id'];
        this.trainingSessionId = response['data']['sessionId'];
        this.completedMicrocicles = Immutable.fromJS(response['data']['completedMicrocicles']);
        this.completedTrainings = Immutable.fromJS(response['data']['completedTrainings']);
        this.completedExercisePlans = Immutable.fromJS(response['data']['completedExercisePlans']);
    }
}
