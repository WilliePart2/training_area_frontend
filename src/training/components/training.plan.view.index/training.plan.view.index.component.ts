import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanService } from '../../services/training.plan.service';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';

@Component({
    selector: 'training-plan-view-index',
    templateUrl: './training.plan.view.index.component.html',
    styleUrls: ['./training.plan.view.index.component.css']
})

export class TrainingPlanViewIndexComponent extends ProtectedComponent implements OnInit {
    id: number;
    _rating: number;
    _isInit: boolean;
    ratingChangeProcess: boolean;
    set rating(val: number) {
        this._rating = val;
        if (this._isInit) {
            this.setRating();
        }
    }
    get rating() { return this._rating; }

    _commonLabels: TrainingCommonLabels;
    constructor (
        protected userManager: UserManagerService,
        private activeRoute: ActivatedRoute,
        private planService: TrainingPlanService,
        private labelService: LabelService
    ) {
        super(userManager);
    }
    ngOnInit() {
        this._isInit = false;
        this.getIdFromRoute().subscribe(() => {
            this.planService.getRating(this.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.rating = resp['data'];
                });
                this._isInit = true;
            }, error => {
                this._isInit = true;
            });
        });

        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
    }
    setRating() {
        const timeStart = Date.now();
        const minTime = 500;
        this.enableRatingProcess();
        this.planService.setRating(this.id, this.rating).subscribe(response => {
            this.checkResponse(response, resp => {});
            this.disableRatingProcess(timeStart, minTime);
        }, error => {
            this.disableRatingProcess(timeStart, minTime);
        });
    }
    getIdFromRoute() {
        return Observable.create(observer => {
            this.activeRoute.queryParams.subscribe(params => {
                this.id = params.id;
                observer.next();
                observer.complete();
            });
        });
    }
    enableRatingProcess() {
        this.ratingChangeProcess = true;
    }
    disableRatingProcess(startTime: number, duration: number) {
        const now = Date.now();
        const activeTime = now - startTime;
        if (activeTime >= duration) {
            this.ratingChangeProcess = false;
            return;
        }
        setTimeout(_ => this.ratingChangeProcess = false, activeTime);
    }
}
