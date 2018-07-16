import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanItemModel } from '../../models/training.plan.item.model';
import { TrainingPlanService } from '../../services/training.plan.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';

@Component({
    selector: 'listing-training-plans',
    templateUrl: './listing.training.plans.component.html',
    styleUrls: ['./listing.training.plans.component.css']
})

export class ListingTrainingPlansComponent extends ProtectedComponent implements OnInit {
    items: TrainingPlanItemModel [];
    _globalErrorMessage = 'Ошибка соединения с сервером данные не получены';
    userId: number;
    process: boolean;
    processMessage: string;

    get page() {
        return this._page;
    }

    set page(pageNumber: number) {
        this._page = pageNumber;
        this.correctOffset();
        this.loadData();
    }

    _commonLabels: TrainingCommonLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        protected userManager: UserManagerService,
        private planService: TrainingPlanService,
        private route: ActivatedRoute,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];

        this.process = false;
        this.userId = this.userManager.id;
        this.loadData();
    }

    /** Метод для загрузки тренировочных планов */
    loadData() {
        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.planService.loadListingOwnTrainingPlans(this.offset, this.limit, this.userId).subscribe(response => {
            this.checkResponse(response, this.loadDataHandler.bind(this));
            this.totalCount = response['totalCount'];
            this.disableDimmer();
        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
            this.disableDimmer();
        });
    }
    loadDataHandler(response) {
        this.items = response['trainingData'];
    }

    /** Обработчики событий */
    /** Редактирование тренировочного плана */
    viewTrainingPlan(id: number) {
        this.route.pathFromRoot.forEach(item => {
            if (`${item.snapshot.url}` === 'mentor') { this.userManager.redirectUser(`/mentor/training/training-plan-view`, {id}); }
            if (`${item.snapshot.url}` === 'user') { this.userManager.redirectUser(`/user/training/training-plan-view`, {id}); }
        });
    }
    /** Удаление тренировочного плана */
    removeTrainingPlan(event: any, id: string) {
        this.enableDimmer(this._dimmerLabels.SENDING_REQUEST);
        event.stopPropagation();

        this.planService.removeTrainingPlan(id).subscribe(response => {
            this.checkResponse(response, this.removeTrainingPlanHandler.bind(this), id);
            this.disableDimmer();
        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
            this.disableDimmer();
        });
    }
    removeTrainingPlanHandler(id: string) {
        this.items = this.items.filter(item => item.id !== id);
    }
    /** Управление димером */
    enableDimmer(message: string) {
        this.process = true;
        this.processMessage = message;
    }
    disableDimmer() {
        this.process = false;
        this.processMessage = '';
    }
}
