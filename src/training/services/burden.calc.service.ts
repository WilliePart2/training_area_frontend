import { Injectable } from '@angular/core';
import { LogService } from '../../common/log.service';

import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';
import { IImmutableTrainingModel } from '../models/training.model';
import { IImmutableBaseList } from '../models/immutable.base';

export interface IBurden {
    tonnage: number;
    averageWeight: number;
    averageInt: number;
    KPSH: number;
}

@Injectable()
export class BurdenCalcService {
    constructor(private loger: LogService) {}
    KPSH(repeats: number,  repeatsSection: number): number {
        return repeats * repeatsSection;
    }
    tonnage(repeats: number, weight: number): number {
        return repeats * weight;
    }
    averageWeight(kpsh: number, weight: number): number {
        return Math.round(weight / kpsh) || 0;
    }
    averageInt(oneRepeatMaximum: number, averageWeight: number): number {
        const result = Math.round((averageWeight / oneRepeatMaximum) * 100);
        return Number.isFinite(result) ? result : 0;
    }

    /** Метод подсчета тренировочной нагрузки в упражнении */
    calculateExerciseParams(exercise: IImmutableTrainingExerciseModel): IBurden {
        let KPSH: number = 0;
        let tonnage: number = 0;
        let averageWeight: number = 0;
        let averageInt: number = 0;
        if (exercise && exercise.has('plans')) {
        exercise.get('plans').forEach(item => {
            KPSH += item.get('repeats') * item.get('repeatSection');
                tonnage += item.get('weight') * (item.get('repeats') * item.get('repeatSection'));
            });
            averageWeight = Math.round(tonnage / KPSH);
            averageInt = 0;
            if (exercise.get('oneRepeatMaximum')) {
                averageInt = Math.round((averageWeight / exercise.get('oneRepeatMaximum')) * 100);
            }
        }
        return {
            KPSH,
            tonnage,
            averageWeight: averageWeight || 0,
            averageInt: Number.isFinite(averageInt) ? averageInt : 0
        };
    }
    /** Метод подсчета тренировочной нагрузки в тренировке */
    calculateTrainingParams(training: IImmutableTrainingModel): IBurden {
        let KPSH: number = 0;
        let tonnage: number = 0;
        let averageInt: number = 0;
        let averageWeight: number = 0;
        let counter: number = 0;
        if (training && training.has('exercises')) {
            training.get('exercises').forEach(exercise => {
                const exerciseParams = this.calculateExerciseParams(exercise);
                KPSH += exerciseParams.KPSH;
                tonnage += exerciseParams.tonnage;
                averageInt += exerciseParams.averageInt;
                counter++;
            });
            averageWeight = Math.round(tonnage / KPSH);
            if (averageInt) {
                averageInt = Math.round(averageInt / counter);
            }
        }
        return {
            KPSH,
            tonnage,
            averageInt : Number.isFinite(averageInt) ? averageInt : 0,
            averageWeight: averageWeight || 0
        };
    }
    /** Метод подсчета тренировочной назгурки в микроцыкле */
    calculateTotalParams(trainings: IImmutableBaseList<IImmutableTrainingModel>): IBurden {
        let KPSH: number = 0;
        let tonnage: number = 0;
        let averageInt: number = 0;
        let averageWeight: number = 0;
        let counter: number = 0;
        if (trainings) {
            trainings.forEach(item => {
                if (!item) { return; }
                const trainingParams = this.calculateTrainingParams(item);
                KPSH += trainingParams.KPSH;
                tonnage += trainingParams.tonnage;
                averageInt += trainingParams.averageInt;
                counter++;
            });
            averageWeight = Math.round(tonnage / KPSH);
            if (averageInt) {
                averageInt = Math.round(averageInt / counter);
            }
        }
        return {
            KPSH,
            tonnage,
            averageWeight: averageWeight || 0,
            averageInt: Number.isFinite(averageInt) ? averageInt : 0
        };
    }
}
