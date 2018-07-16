import { IImmutableBaseList, IImmutableBaseMap } from './immutable.base';

export interface ITrainingPlanUpdateResponse extends IImmutableBaseMap<ITrainingResponse> {}
export interface ITrainingResponse {
    createdMicrocicles: IImmutableBaseList<ICreatedMicrocicle>;
    updatedMicrocicles: IImmutableBaseList<IUpdatedMicrocicle>;
}

/** Модели создаваемых даных */
export interface ICreatedMicrocicle extends IImmutableBaseMap<ICMicrocicle> {}
export interface ICMicrocicle {
    previousMicrocicleId: number;
    microcicleId: number;
    createdTrainings: IImmutableBaseList<ICreatedTraining>;
}

export interface ICreatedTraining extends IImmutableBaseMap<ICTraining> {}
export interface ICTraining {
    previousTrainingId: number;
    trainingId: number;
    createdExercises: IImmutableBaseList<ICreatedExercises>;
}

export interface ICreatedExercises extends IImmutableBaseMap<ICExercises> {}
export interface ICExercises {
    previousUniqueId: string;
    exerciseUniqueId: string;
    createdPlans: IImmutableBaseList<ICreatedPlans>;
}

export interface ICreatedPlans extends IImmutableBaseMap<ICPlans> {}
export interface ICPlans {
    previousPlanId: number;
    planId: number;
}

/** Модели обновляемых данных */
export interface IUpdatedMicrocicle extends IImmutableBaseMap<IUMicrocicle> {}
export interface IUMicrocicle {
    microcicleId: number;
    createdTrainings: IImmutableBaseList<ICreatedTraining>;
    updatedTrainings: IImmutableBaseList<IUpdatedTraining>;
}

export interface IUpdatedTraining extends IImmutableBaseMap<IUTraining> {}
export interface IUTraining {
    trainingId: number;
    createdExercises: IImmutableBaseList<ICreatedExercises>;
    updatedExercises: IImmutableBaseList<IUpdatedExercise>;
}

export interface IUpdatedExercise extends IImmutableBaseMap<IUExercise> {}
export interface IUExercise {
    exerciseUniqueId: string;
    createdPlans: IImmutableBaseList<ICreatedPlans>;
}
