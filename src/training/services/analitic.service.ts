import { Injectable } from '@angular/core';
import { IImmutableBaseList } from '../models/immutable.base';
import { MicrocicleModel } from '../models/microcicle.model';
import { IImmutableMicrocicleModel } from '../models/microcicle.model';
import { TrainingModel } from '../models/training.model';
import { TrainingExerciseModel } from '../models/training.exercise.model';
import { BasePlanItemModel } from '../models/base.plan.item.model';
import {EditExerciseModel} from '../models/edit.exercise.model';

@Injectable()

export class AnaliticService {
    /** Методы для обнаружения изменений в тренировочном плане */
    /** Метод сравнивает два хранилища микроцыклов */
    checkTrainingPlan(
        oldStore: MicrocicleModel [],
        newStore: MicrocicleModel [],
    ): MicrocicleModel [] {
        let different = [];
        newStore.forEach(newItem => {
            /** Ести в старом хранилище есть элементы */
            if (oldStore.length) {
                /** Ищем микроцыкл в старом хранидище */
                const equalMicrocicle = oldStore.find(oldMicrocicle => oldMicrocicle.microcicleId === newItem.microcicleId);
                if (equalMicrocicle) {
                    const differentTrainings = this.compareMicrocicles(equalMicrocicle, newItem);
                    if (differentTrainings.length) {
                        different = [...different, {
                            ...newItem,
                            trainingData: differentTrainings
                        }];
                        return;
                    }
                    return;
                }
                different = [...different, newItem];
                return;
            }
            /** Если старое хранилище пустое */
            different = [...different, newItem];
        });

        return different;
    }

    /**
     * Метод сравнивает два микроцыкла между собой
     * Возвращает true если микроциклы равны
     */
    compareMicrocicles(oldMicrocicle: MicrocicleModel, newMicrocicle: MicrocicleModel): TrainingModel [] {
        const different: TrainingModel [] = [];
        newMicrocicle.trainingData.forEach((newItem: TrainingModel) => {
            if (oldMicrocicle.trainingData.length) {
                const equalItem = oldMicrocicle.trainingData.find(oldItem => oldItem.id === newItem.id);
                if (equalItem) {
                    const differentExercises = this.compareTrainings(equalItem, newItem);
                    if (differentExercises.length) {
                        different.push({
                            ...newItem,
                            exercises: differentExercises
                        });
                        return;
                    }
                    return;
                }
                different.push(newItem);
                return;
            }
            different.push(newItem);
        });

        return [...different];
    }

    /**
     * Метод сравнивает тренировки между собой
     * Метод возвращает масив измененных упражнений
     */
    compareTrainings(oldTraining, newTraining): TrainingExerciseModel [] {
        const different: TrainingExerciseModel [] = [];
        newTraining.exercises.forEach(newItem => {
            /** Если хранилище старых упражнений не пусто */
            if (oldTraining.exercises.length) {
                const equalItem = oldTraining.exercises.find(oldItem => oldItem.uniqueId === newItem.uniqueId);
                /** Если упражнение с таким идентификатором существует */
                if (equalItem) {
                    const differentPlans = this.compareExercise(equalItem, newItem);
                    if (differentPlans.length) {
                        different.push({
                            ...newItem,
                            plans: differentPlans
                        });
                    }
                    return;
                }
                /** Добавляем упражнение как новое */
                different.push(newItem);
                return;
            }
            different.push(newItem);
        });
        return [...different];
    }

    /** Метод сравнивает упражнения между собой */
    compareExercise(oldExercise: TrainingExerciseModel, newExercise: TrainingExerciseModel): BasePlanItemModel [] {
        const different: BasePlanItemModel [] = [];
        newExercise.plans.forEach(newItem => {
            if (oldExercise.plans.length) {
                const equalItem = oldExercise.plans.find(oldItem => oldItem.id === newItem.id);
                /** Сравниваем имеющийся тренировочный план */
                if (equalItem) {
                    const isDiff = this.compareBasePlans(equalItem, newItem);
                    if (isDiff) {
                        different.push(newItem);
                    }
                    return;
                }
                /** Добавляем новый тренировочный план */
                different.push(newItem);
                return;
            }
            different.push(newItem);
        });
        return [...different];
    }

    /** Метод сравнивает тренировочные планы */
    compareBasePlans(oldPlan: BasePlanItemModel, newPlan: BasePlanItemModel) {
        const errors = [];
        if (oldPlan.weight !== newPlan.weight) { errors.push('weight different'); }
        if (oldPlan.repeats !== newPlan.repeats) { errors.push('repeats different'); }
        if (oldPlan.repeatSection !== newPlan.repeatSection) { errors.push('repeat section different'); }
        return !!errors.length;
    }

    /** Методы для обнаружения изменений в шаблоне упражнений */
    compareLayout(oldStore: EditExerciseModel [], newStore: EditExerciseModel []) {
        let result = [];
        newStore.forEach(item => {
            const oldItem = oldStore.find(oItem => oItem.id === item.id);
            if (oldItem && parseInt(`${oldItem.oneRepeatMaximum}`, 10) === parseInt(`${item.oneRepeatMaximum}`, 10)) {
                return;
            }
            result = [...result, item];
        });
        return result;
    }
}
