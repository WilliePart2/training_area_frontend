import { Injectable } from '@angular/core';
import * as Immutable from 'immutable';
import { TrainingExerciseModel } from '../../training/models/training.exercise.model';
import { MicrocicleService } from '../../training/services/microcicle.service';
import { LogService } from '../../common/log.service';
import { BurdenCalcService } from '../../training/services/burden.calc.service';

import { TrainingModel } from '../../training/models/training.model';
import { MicrocicleModel } from '../../training/models/microcicle.model';
import { LayoutExerciseModel } from '../../training/models/layout.exercise.model';

@Injectable()
export class LayoutExerciseChartService {

    constructor(
        private microcicleService: MicrocicleService,
        private calcService: BurdenCalcService,
        private loger: LogService
    ) {}

    getDatasetData(layout: LayoutExerciseModel [], microcicles: MicrocicleModel [], characteristic: string) {
        let result = [];
        this.log(layout, 'Layout provide to getDatasetData method');
        this.log(microcicles, 'Microcicles provide to getDatasetData method');
        layout.forEach(layoutItem => {
            result = [...result, {
                label: layoutItem.exercise.name,
                data: this.getDataAboutExercise(microcicles, layoutItem.exercise.id, characteristic)
            }];
        });
        return result;
    }

    getDataAboutExercise(microcicles: MicrocicleModel [], exerciseId: number, characteristic: string) {
        let exercises = [];
        microcicles.forEach((microcicleItem, index) => {
            let tmpExercises;
            if (microcicleItem.trainingData.length) {
                tmpExercises = this.findAllExercisesInTraining(microcicleItem.trainingData, exerciseId);
            }
            if (!tmpExercises) {
                tmpExercises = null;
            }
            exercises = [...exercises, {
                microcicleIndex: index,
                exercises: tmpExercises
            }];
        });
        this.log(exercises, 'Exercises witch was returned from getDataAboutExercise method');
        return this.calculateData(exercises, characteristic);
    }

    findAllExercisesInTraining(trainings: TrainingModel [], exerciseId: number) {
        let exercises = [];
        trainings.forEach(trainingItem => {
            if (trainingItem.exercises.length) {
                trainingItem.exercises.forEach(exerciseItem => {
                    if (exerciseItem.exerciseId === exerciseId) {
                        exercises = [...exercises, exerciseItem];
                    }
                });
            }
        });
        return exercises;
    }
    calculateData(exercises: any, characteristic: string) {
        const result = [];
        exercises.forEach(exerciseItem => {
            result[exerciseItem['microcicleIndex']] = 0;
            if (exerciseItem['exercises'] && exerciseItem['exercises'].length) {
                result[exerciseItem['microcicleIndex']] = this.calcService.calculateTrainingParams(
                    Immutable.fromJS({
                        id: 1,
                        name: 'some',
                        microcicleId: 1,
                        exercises: exerciseItem['exercises']
                    })
                )[characteristic]
            }
        });
        return result;
    }
    getReadableCharateristic(characteristic: string) {
        let name = '';
        switch (characteristic) {
            case 'averageInt': name = 'Средняя интенсивность'; break;
            case 'averageWeight': name = 'Средний вес'; break;
            case 'tonnage': name = 'Тоннаж'; break;
            case 'KPSH': name = 'КПШ'; break;
        }
        return name;
    }

    /** Helpers */
    log(message: any, category = '') {
        this.loger.log(message, category);
    }
}
