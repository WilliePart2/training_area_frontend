import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as Immutable from 'immutable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanService } from '../../services/training.plan.service';
import { LogService } from '../../../common/log.service';
import { LabelService } from '../../../common/label.service';

import {CompletedMicrocicleModel, CompletedTrainingModel} from '../../models/completed.data.models';
import {UsersPlanDataModel} from '../../models/users.plan.data.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';

import { IListPlansForPerformModel } from '../../models/plan.for.perform.model';
import { IImmutableBaseList } from '../../models/immutable.base';

@Component({
    selector: 'complete-training-plan',
    templateUrl: './complete.training.plan.component.html'
})

export class CompleteTrainingPlanComponent extends ProtectedComponent implements OnInit {
    id: number;
    trainingSessionId: string;
    mode = 'complete';
    completedMicrocicles: IImmutableBaseList<CompletedMicrocicleModel>;
    completedTrainings: IImmutableBaseList<CompletedTrainingModel>;
    completedExercisePlans: IListPlansForPerformModel;

    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;
    constructor(
        protected userManager: UserManagerService,
        private route: ActivatedRoute,
        private planService: TrainingPlanService,
        private loger: LogService,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.route.queryParams.subscribe(queryParams => {
            this.id = queryParams.id;
            this.trainingSessionId = queryParams.tsId; /** trainingSessionId */
        });
        this.loadCompletedExercisePlans();
    }

    loadCompletedExercisePlans() {
        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.planService.loadCompletedPlan(this.id, this.trainingSessionId).subscribe(response => {
            this.checkResponse(response, resp => {
                this.completedMicrocicles = Immutable.fromJS(resp['data']['completedMicrocicles']);
                this.completedTrainings = Immutable.fromJS(resp['data']['completedTrainings']);
                this.completedExercisePlans = Immutable.fromJS(resp['data']['completedExercisePlans']);
            });
            this.disableDimmer();
        }, error => {
            this.disableDimmer();
            this.globalErrorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
        });
    }

    /** Helpers */
    log(message: any, category = '') {
        this.loger.log(message, category);
    }
}
