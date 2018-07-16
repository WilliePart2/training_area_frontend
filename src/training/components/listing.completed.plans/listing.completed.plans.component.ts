import { Component, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { TrainingPlanService } from '../../services/training.plan.service';
import { LogService } from '../../../common/log.service';

@Component({
    selector: 'listing-training-plans-component',
    templateUrl: './listing.completed.training.plans.component.html'
})

export class ListingCompletedPlansComponent extends ProtectedComponent implements OnInit {
    _emptyDataMessage = 'На данный момент нету завершенный планов';
    items: any [] = [];
    constructor(
        protected userManager: UserManagerService,
        private planService: TrainingPlanService,
        private loger: LogService
    ) {
        super(userManager);
    }
    ngOnInit() {
        this.loadCompletedPlans();
    }
    loadCompletedPlans() {
        this.enableDimmer('Загрузка данных...');
        this.planService.loadCompletedTrainingPlans().subscribe(response => {
            this.checkResponse(response, resp => {
                this.items = resp['data'];
                this.disableDimmer();
            });
        }, error => {
            this.disableDimmer();
            this.globalErrorMessage('Ошибка соединения с сервером, данные не загружены');
        });
    }

    viewCompletePlan(id: number, trainingSessionId: number) {
        if (this.userManager.type === 'mentor') {
            this.userManager.redirectUser('/mentor/training/complete-plan', {
                id,
                tsId: trainingSessionId
            });
            return;
        }
        this.userManager.redirectUser('/user/training/complete-plan', {
            id,
            tsId: trainingSessionId
        });
    }

    /** Helpers */
    log(message: any, category = '') {
        this.loger.log(message, category);
    }
}


