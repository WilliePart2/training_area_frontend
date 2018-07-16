import { TrainingExerciseModel } from './training.exercise.model';
import {IImmutableTrainingExerciseModel} from './training.exercise.model';
import { IImmutableBaseMap } from './immutable.base';
import {IImmutableBaseList} from './immutable.base';
import { ExecutableTrainingExerciseModel, IImExecutableTrainingExerciseModel } from './training.exercise.model';
import * as Immutable from 'immutable';

export class TrainingModel {
    constructor(
        public id: number,
        public microcicleId: number,
        public name: string,
        public exercises: TrainingExerciseModel []
    ) {}
}

export interface ExecutableTrainingModel extends TrainingModel {
    exercises: ExecutableTrainingExerciseModel [];
}

export interface IImmutableTrainingModel extends IImmutableBaseMap<TrainingModel> {
  exercises: IImmutableBaseList<IImmutableTrainingExerciseModel>;
}

export interface IImExecutableTrainingModel extends IImmutableBaseMap<ExecutableTrainingModel> {
    execises: IImmutableBaseList<IImExecutableTrainingExerciseModel>;
}
