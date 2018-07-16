import { BasePlanItemModel } from './base.plan.item.model';

export interface HandlePlanItemModel extends BasePlanItemModel {
    doneWeight: number;
    doneRepeats: number;
    doneRepeatSection: number;
    baseTrainingPlanId: number;
    order: number;
}
