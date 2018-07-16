import { IImmutableTrainingModel } from './training.model';
import { IImmutableBaseList } from './immutable.base';

export interface IDeleteTrainingResult {
    modOldTrainings: IImmutableBaseList<IImmutableTrainingModel>;
    modNewTrainings: IImmutableBaseList<IImmutableTrainingModel>;
}
