import { Component, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanService } from '../../services/training.plan.service';
import { LabelService } from '../../../common/label.service';

import { TrainingPlanItemModel } from '../../models/training.plan.item.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';

@Component({
    selector: 'search-training-plans',
    templateUrl: './search.training.plans.component.html',
    styleUrls: ['./search.training.plans.component.css']
})

export class SearchTrainingPlansComponent extends ProtectedComponent implements OnInit {
    trySearch: boolean;
    _typeSearch: 'mentorName' | 'planName';
    searchingProcess: boolean;
    set typeSearch(val: string) { this._typeSearch = parseInt(val, 10) === 1 ? 'planName' : 'mentorName'; }
    get typeSearch() { return this._typeSearch === 'planName' ? '1' : '2' ; }
    items: Array<TrainingPlanItemModel>;
    name: string;
    category: '0' | '1' | '2' | '3' ;
    set page (val: number) {
        this._page = val;
        this.correctOffset();
        this.search();
    }
    get page() { return this._page; }

    _commonLabels: TrainingCommonLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        protected userManager: UserManagerService,
        private planService: TrainingPlanService,
        private labelService: LabelService
    ) {
        super(userManager);
    }
    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];

        this.category = '0';
        this.typeSearch = '1';
    }
    search() {
        this.searchingProcess = true;
        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        const searchParams: {
            name?: string,
            category?: number,
            type: 'mentorName' | 'planName'
        } = {
            type: this._typeSearch || 'planName'
        };
        if (this.name !== undefined) {
            searchParams.name = this.name;
        }
        if (this.category !== undefined) {
            searchParams.category = parseInt(this.category, 10);
        }
        this.planService.getSearchResult(searchParams, this.offset, this.limit).subscribe(response => {
            this.checkResponse(response, resp => {
                this.items = <Array<TrainingPlanItemModel>>resp['data']['mainData'];
                this.totalCount = resp['data']['totalCount'];
                this.disableDimmer();
                this.trySearch = true;
            });
            this.searchingProcess = false;
        }, error => {
            this.disableDimmer();
            this.trySearch = true;
            this.searchingProcess = false;
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
        });
    }
    viewSearchedTrainingPlan(trainingPlanId: number) {
        let url = '/training/training-plan-view';
        const queryParams = {id: trainingPlanId};
        if (this.userManager.type === 'mentor') {
            url = `mentor${url}`;
        } else {
            url = `user${url}`;
        }
        console.log(url);
        this.userManager.redirectUser(`/${url}`, queryParams);
    }
}
