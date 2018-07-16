import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ExerciseService } from './exercise.service';
import { LogService } from '../../common/log.service';
import { UserManagerService } from '../../common/user.manager.service';
import { BaseService } from '../../common/base.service';
import { UrlService } from '../../common/url.service';

import { Exercise } from '../models/layout.exercise.model';
import { BasePlanItemModel } from '../models/base.plan.item.model';
import { TrainingExerciseModel } from '../models/training.exercise.model';
import { TrainingModel } from '../models/training.model';
import { ICompleteTraining } from '../models/complete.training.model';
import { IPlanForPerformMutableModel } from '../models/plan.for.perform.model';

import { IImmutableBasePlanItemModel } from '../models/base.plan.item.model';
import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';
import { IImmutableBaseList } from '../models/immutable.base';
import * as Immutable from 'immutable';

@Injectable()

export class TrainingService extends BaseService {
    constructor(
        private exerciseService: ExerciseService,
        private loger: LogService,
        private urlService: UrlService,
        protected userManager: UserManagerService,
        protected http: HttpClient
    ) {
        super(userManager, http);
    }
    /* Метод создает упражнение */
    createExercise(trainingId: number, item: Exercise): IImmutableTrainingExerciseModel {
        const uniqueId = `${this.generateId()}_${Math.random()}_${Math.random()}`;
        return <IImmutableTrainingExerciseModel>Immutable.fromJS({
            id: item.id,
            uniqueId: uniqueId,
            exerciseId: item.exercise.id, /** Это идентификатор тренировочного упражнения */
            exerciseName: item.exercise.name,
            oneRepeatMaximum: item.oneRepeatMaximum,
            trainingId,
            plans: [this.exerciseService.createPlan(uniqueId, 0, 0, 0)]
        });
    }
    /* Метод обновляет упражнение */
    updateExercise(
        oldExerciseStore: IImmutableBaseList<IImmutableTrainingExerciseModel>,
        newItem: IImmutableTrainingExerciseModel
    ) {
        return oldExerciseStore.map(oldItem => {
            if (oldItem.get('uniqueId') === newItem.get('uniqueId')) {
                return newItem;
            }
            return oldItem;
        });
    }
    /* Метод удаляет упражнение */
    deleteExercise(
        tmpExStorage: IImmutableBaseList<IImmutableTrainingExerciseModel>,
        persExStorage: IImmutableBaseList<IImmutableTrainingExerciseModel>,
        exerciseUniqueId: string,
        callback: any
    ) {
        /** Обрабатываем хранилиже временных упражнений */
        const tmpExerciseIndex = tmpExStorage.findIndex(newExerciseItem => newExerciseItem.get('uniqueId') === exerciseUniqueId);
        if (tmpExerciseIndex !== -1) {
            tmpExStorage = tmpExStorage.delete(tmpExerciseIndex);
        } else {
            /** Обрабатываем хранилище постоянных упражнений */
            const persExerciseIndex = persExStorage.findIndex(persExerciseItem => persExerciseItem.get('uniqueId') === exerciseUniqueId);
            if (persExerciseIndex !== -1) {
                /* Возвращаеться индекс элемента! */
                callback(persExerciseIndex); /* Нужно посмотреть будет ли работать */
                persExStorage = persExStorage.delete(persExerciseIndex);
            }
        }
        return persExStorage.concat(tmpExStorage);
    }
    /** Метод для создает тренировочную раскладку */
    createPlan(
        exerciseId: string,
        weight: number,
        repeats: number,
        repeatSection: number
    ): IImmutableBasePlanItemModel {
        return Immutable.Map({
            id: this.generateId(), // Временное значение
            exerciseId: exerciseId,
            weight: parseInt(`${weight}`, 10),
            repeats: parseInt(`${repeats}`, 10),
            repeatSection: parseInt(`${repeatSection}`, 10)
        });
    }
    /* Вспомогательные методы */
    generateId(): number {
        return Math.round(Number(`${Math.round(Date.now())}${Math.random() * 10}`));
    }
    /* Метод подготавливает раскладки к редактированию\сохранению */
    prepareData(
        exercises: IImmutableBaseList<IImmutableTrainingExerciseModel>,
        mode: string
    ) {
        const totalEx = exercises.map(exercise => {
            /** Обходим тренировочные планы */
            if (mode === 'edit') {
                return exercise.update('plans', oldPlans => {
                    return oldPlans.unshift(this.createPlan(exercise.get('uniqueId'), 0, 0, 0));
                });
            } else {
                return  exercise.update('plans', oldPlans => oldPlans.rest());
            }
        });
        return totalEx;
    }
    setTrainingAsComplete(data: ICompleteTraining) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/set-training-as-complete`,
                {
                    MicrocicleTrainingManager: {
                        plans: data.plans,
                        sessionId: data.trainingSessionId,
                        id: data.trainingPlanId,
                        trainingId: data.trainingId
                    }
                },
                {headers}
            );
        });
    }
}
