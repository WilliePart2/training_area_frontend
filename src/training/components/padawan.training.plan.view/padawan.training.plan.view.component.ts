import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import * as Immutable from 'immutable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanService } from '../../services/training.plan.service';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';

@Component({
    selector: 'padawan-training-plan-view',
    templateUrl: './padawan.training.plan.view.component.html'
})

export class PadawanTrainingPlanViewComponent extends ProtectedComponent implements OnInit {
    currentPlanId: number;
    padawanId: number;
    trainingSessionId: string;
    mode = 'process';

    completedMicrocicles: any;
    completedTrainings: any;
    completedExercisePlans: any;

    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;
    constructor(
        protected userManager: UserManagerService,
        private planService: TrainingPlanService,
        private route: ActivatedRoute,
        private labelSerice: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelSerice.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.getDataForQuery()
            /** in this place may be problem */
            // .flatMap(() => this.loadMainInfo())
            .subscribe(() => this.disableDimmer());
    }

    loadMainInfo() {
        if (!this.trainingSessionId) {
            return Observable.create(observer => {
                this.planService.loadCurrentTrainingPlan(this.padawanId).subscribe(response => {
                    this.checkResponse(response, resp => {
                        this.currentPlanId = resp['data']['id'];
                        this.trainingSessionId = resp['data']['sessionId'];
                        this.completedMicrocicles = Immutable.fromJS(resp['data']['completedMicrocicles']);
                        this.completedTrainings = Immutable.fromJS(resp['data']['completedTrainings']);
                        this.completedExercisePlans = Immutable.fromJS(resp['data']['completedExercisePlans']);
                        observer.next();
                        observer.complete();
                    });
                }, error => {
                    this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                    observer.error();
                });
            });
        }
        return Observable.create(observer => {
            this.planService.loadCompletedPlan(this.currentPlanId, this.trainingSessionId, this.padawanId)
                .subscribe(response => {
                    this.checkResponse(response, resp => {
                        // do something
                        observer.next();
                        observer.complete();
                    });
                }, error => {
                    observer.error();
                });
        });
    }

    getDataForQuery() {
        return Observable.create(observer => {
            try {
                this.route.queryParams.subscribe(queryParams => {
                    this.currentPlanId = queryParams.id ? queryParams.id : null;
                    /** параметр передаеться для текущего тренировочного плана подопечного */
                    this.padawanId = queryParams.pId ? queryParams.pId : null;
                    /** параметр передаеться для выполненых тренировочных планов подопечных */
                    this.trainingSessionId = queryParams.tsId ? queryParams.tsId : null;
                }, error => {
                    observer.error();
                });
                observer.next();
                observer.complete();
            } catch (err) {
                observer.error(err);
            }
        });
    }
}
