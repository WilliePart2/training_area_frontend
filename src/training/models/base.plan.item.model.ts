import { IImmutableBaseMap, IImmutableBaseList } from './immutable.base';
import { IPlanForPerformModel } from './plan.for.perform.model';

export interface BasePlanItemModel {
    id: number;
    exerciseId: string;
    weight: number;
    repeats: number;
    repeatSection: number;
}

export interface IImmutableBasePlanItemModel extends IImmutableBaseMap<BasePlanItemModel> {}

export interface ExecutableBasePlanItemModel extends BasePlanItemModel {
    dataForPerform: IImmutableBaseList<IPlanForPerformModel>;
}
