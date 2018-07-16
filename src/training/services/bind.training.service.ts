import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as actions from '../actions/actions.type';

import { TrainingExerciseModel } from '../models/training.exercise.model';
import { BasePlanItemModel } from '../models/base.plan.item.model';

import { IImmutableTrainingModel, IImExecutableTrainingModel } from '../models/training.model';
import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';
import { IImmutableBasePlanItemModel } from '../models/base.plan.item.model';

@Injectable()
export class BindTrainingService {
    private _trainingShareData: Subject<any>;
    core$: Observable<any>;
    constructor() {
        this.core$ = this._trainingShareData = new Subject();
        // this.core$ = this._trainingShareData.asObservable();
    }
    getCore() {
        return this._trainingShareData;
    }
    updateTrainingData(training: IImmutableTrainingModel | IImExecutableTrainingModel) {
        this._trainingShareData.next({
            type: actions.UPDATE_TRAINING,
            data: training
        });
    }
    deleteTrainingData(training: IImmutableTrainingModel) {
        this._trainingShareData.next({
            type: actions.DELETE_TRAINING,
            data: training
        });
    }

    shalowUpdateExercise(exercise: IImmutableTrainingExerciseModel) {
        this._trainingShareData.next({
            type: actions.SHALOW_UPDATE_EXERCISE,
            data: exercise
        });
    }
    updateExercise(exercise: IImmutableTrainingExerciseModel) {
        this._trainingShareData.next({
            type: actions.UPDATE_EXERCISE,
            data: exercise
        });
    }
    deletePersistantExercise(exercise: IImmutableTrainingExerciseModel) {
        this._trainingShareData.next({
            type: actions.DELETE_PERSISTANT_EXERCISE,
            data: exercise
        });
    }
    deleteExercise(exercise: IImmutableTrainingExerciseModel) {
        this._trainingShareData.next({
            type: actions.DELETE_EXERCISE,
            data: exercise
        });
    }

    deletePlan(plan: IImmutableBasePlanItemModel) {
        this._trainingShareData.next({
            type: actions.DELETE_PLAN,
            data: plan
        });
    }

}
