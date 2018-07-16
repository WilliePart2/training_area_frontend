import { IImmutableBaseMap, IImmutableBaseList } from './immutable.base';

export interface IImPerformItemListFromResponse extends IImmutableBaseList<IImPerformItemFromResponse> {}
export interface IImPerformItemFromResponse extends IImmutableBaseMap<IPerformItemFromResponseMutable> {}
export interface IPerformItemFromResponseMutable {
    previousPerformPlanId: number;
    newPerformPlanId: number;
    parentPlanId: number;
}
