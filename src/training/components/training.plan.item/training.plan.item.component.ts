import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { TrainingPlanItemModel } from '../../models/training.plan.item.model';

@Component({
    selector: '[training-plan-item]',
    templateUrl: './training.plan.item.component.html'
})

export class TrainingPlanItemComponent {
    _item: TrainingPlanItemModel;
    @Input('training-plan-item') set item (obj: TrainingPlanItemModel) {
        this._item = obj;
    }
    get item() { return this._item; }
    @Input() index: number;

    constructor(private router: Router) { }

    viewTrainintPlan() {
        this.router.navigate(['/training/view-training-plan', this._item.id]);
    }
}
