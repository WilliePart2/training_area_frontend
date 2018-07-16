import { TrainingModel } from './training.model';
import {IImmutableTrainingModel} from './training.model';
import {IImmutableBaseMap} from './immutable.base';
import {IImmutableBaseList} from './immutable.base';
import * as Immutable from 'immutable';

export interface MicrocicleModel {
    microcicleId: number;
    microcicleName: string;
    trainingData: TrainingModel [];
}

export interface IImmutableMicrocicleModel extends IImmutableBaseMap<MicrocicleModel> {
    trainingData: IImmutableBaseList<IImmutableTrainingModel>;
}
