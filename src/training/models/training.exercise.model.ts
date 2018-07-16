import {BasePlanItemModel} from './base.plan.item.model';
import {IImmutableBasePlanItemModel} from './base.plan.item.model';
import {IImmutableBaseMap} from './immutable.base';
import {IImmutableBaseList} from './immutable.base';
import { ExecutableBasePlanItemModel } from './base.plan.item.model';

export interface TrainingExerciseModel {
    id: number; /** Идентификатор тренировочного упражнения */
    uniqueId: string; /** Уникальный id для связи тренировки и упражнения */
    exerciseId: number; /** Идентификатор упражнения */
    exerciseName: string;
    oneRepeatMaximum: number;
    trainingId: number;
    plans: BasePlanItemModel [];
}

export interface IImmutableTrainingExerciseModel extends IImmutableBaseMap<TrainingExerciseModel> {
    plans: IImmutableBaseList<IImmutableBasePlanItemModel>;
}

export interface ExecutableTrainingExerciseModel extends TrainingExerciseModel {
    plans: ExecutableBasePlanItemModel [];
}

export interface IImExecutableTrainingExerciseModel extends IImmutableBaseMap<ExecutableTrainingExerciseModel> {}
