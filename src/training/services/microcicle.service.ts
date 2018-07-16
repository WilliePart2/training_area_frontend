import { Injectable } from '@angular/core';
import * as Immutable from 'immutable';
import { BaseService } from '../../common/base.service';
import { UserManagerService } from '../../common/user.manager.service';
import { HttpClient} from '@angular/common/http';
import { TrainingService } from './training.service';
import { ExerciseService } from './exercise.service';
import { LogService } from '../../common/log.service';
import { UrlService } from '../../common/url.service';

import { TrainingModel } from '../models/training.model';
import { IImmutableTrainingModel } from '../models/training.model';
import { TrainingExerciseModel } from '../models/training.exercise.model';
import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';
import { BasePlanItemModel } from '../models/base.plan.item.model';
import { IImmutableBasePlanItemModel } from '../models/base.plan.item.model';
import { Exercise } from '../models/layout.exercise.model';
import { MicrocicleModel } from '../models/microcicle.model';
import { IImmutableMicrocicleModel } from '../models/microcicle.model';
import { LayoutExerciseModel } from '../models/layout.exercise.model';
import { HandlePlanItemModel } from '../models/handle.plan.item.model';
import { IImmutableBaseList } from '../models/immutable.base';
import { IDeleteTrainingResult } from '../models/microcicle.operations.models';
import { ITrainingPlanUpdateResponse } from '../models/training.plan.update.response.model';

@Injectable()
export class MicrocicleService extends BaseService {
    constructor(
        private trainingService: TrainingService,
        private exerciseService: ExerciseService,
        private loger: LogService,
        private urlService: UrlService,
        protected userManager: UserManagerService,
        protected http: HttpClient
    ) {
        super(userManager, http);
    }
    /** Методы управления тренировками */
    createNewTraining(microcicleId: number, trainingName: string, checkedExercises: Exercise []): IImmutableTrainingModel {
        const trainingId = this.generateId();
        let exercises = Immutable.List();
        exercises = exercises.withMutations(mExercises => {
            checkedExercises.forEach(exItem => {
                mExercises.push(this.trainingService.createExercise(trainingId, exItem));
            });
        });

        return <IImmutableTrainingModel>Immutable.Map({
            id: trainingId, // Временный идентификатор
            microcicleId: microcicleId,
            name: trainingName,
            exercises
        });
    }

    deleteTraining(
        persTrainingStore: IImmutableBaseList<IImmutableTrainingModel>,
        newTrainingStore: IImmutableBaseList<IImmutableTrainingModel>,
        trainingId: number,
        callback: Function
    ) {
        const result: IDeleteTrainingResult = {
            modNewTrainings: newTrainingStore,
            modOldTrainings: persTrainingStore
        };
        const tmpTrainingIndex = newTrainingStore.findIndex(item => item.get('id') === trainingId);
        if (tmpTrainingIndex !== -1) {
            result.modNewTrainings = newTrainingStore.delete(tmpTrainingIndex);
        } else {
            const persTrainingIndex = persTrainingStore.findIndex(item => item.get('id') === trainingId);
            if (persTrainingIndex !== -1) {
                callback(persTrainingIndex); /* Посмотреть как это отработает */
                result.modOldTrainings = persTrainingStore.delete(persTrainingIndex);
            }
        }
        return result;
    }

    updateTraining(
        oldTrainingStore: IImmutableBaseList<IImmutableTrainingModel>,
        newTrainingStore: IImmutableBaseList<IImmutableTrainingModel>,
        newItem: IImmutableTrainingModel
    ) {
        if ((!oldTrainingStore || !newTrainingStore) || (!oldTrainingStore.size && !newTrainingStore.size)) {
            return oldTrainingStore.concat(newTrainingStore);
        }
        const resultObj = {
            updatedOldTrainings: oldTrainingStore,
            updatedNewTrainings: newTrainingStore
        };
        const oldItemIndex = oldTrainingStore.findIndex(item => item.get('id') === newItem.get('id'));
        if (oldItemIndex !== -1) {
            resultObj.updatedOldTrainings = oldTrainingStore.update(oldItemIndex, () => newItem);
        } else {
            const newItemIndex = newTrainingStore.findIndex(item => item.get('id') === newItem.get('id'));
            if (newItemIndex !== -1) {
                resultObj.updatedNewTrainings = newTrainingStore.update(newItemIndex, () => newItem);
            }
        }
        return resultObj;
    }

    mergeTrainings(oldTrainings: IImmutableBaseList<IImmutableTrainingModel>, newTrainings: IImmutableBaseList<IImmutableTrainingModel>) {
        return oldTrainings.concat(newTrainings);
    }

    /* Метод подготавливает данные для сохранения на сервере */
    prepareData(microcicle: IImmutableMicrocicleModel, mode: string) {
        return microcicle.update('trainingData', (data: IImmutableTrainingModel) => {
            return data.map(tItem => {
                return tItem.update('exercises', (exData: IImmutableBaseList<IImmutableTrainingExerciseModel>) => {
                    return this.trainingService.prepareData(exData, mode);
                });
            });
        });
    }
    saveMicrocicleInPersistantStorage(
        storage: MicrocicleModel [],
        newMicrociclesStorage: MicrocicleModel [],
        newItem: MicrocicleModel
    ) {
        const resultStorage = storage.map(item => {
            if (item.microcicleId === newItem.microcicleId) {
                return newItem;
            }
            return item;
        });
        const oldAddedMicrocicles = newMicrociclesStorage;
        const resultMicrociclesStorage = [];
        oldAddedMicrocicles.forEach(mItem => {
            if (mItem.microcicleId === newItem.microcicleId) {
                return;
            }
            resultMicrociclesStorage.push(mItem);
        });
        return {
            items: resultStorage,
            newMicrocicles: resultMicrociclesStorage
        };
    }

    /** Вспомогательный метод */
    generateId() {
        return Math.round(Number(`${Math.round(Date.now())}${Math.random() * 10}`));
    }

    /** Метод объединяет хранилища фильтруя уникальные значения по указаному свойству */
    mergeStores(store = [], property = 'id') {
        const result = [];
        const hasHandled = [];
        store.forEach(item => {
            if (hasHandled.indexOf(item[property]) !== -1) { return; }
            result.push(item);
            hasHandled.push(item[property]);
        });
        return result;
    }

    /** Метод изменяет повторные максимумы в упражнениях */
    updateOneRepeatMaximum(layoutExerciseStore: LayoutExerciseModel [], trainingStore: TrainingModel | TrainingModel []) {
        let result: TrainingModel | TrainingModel [] = Array.isArray(trainingStore) ? [] : null;
        if (Array.isArray(trainingStore)) {
            trainingStore.forEach(trainingItem => {
                result = [...<TrainingModel []> result, {
                    ...trainingItem,
                    exercises: handleExercises(trainingItem.exercises, layoutExerciseStore)
                }];
            });
        } else {
            result = {
                ...trainingStore,
                exercises: handleExercises(trainingStore.exercises, layoutExerciseStore)
            };
        }
        function handleExercises(exercises: TrainingExerciseModel [], layOutExerciseStore: LayoutExerciseModel []) {
            if (exercises && !exercises.length) { return exercises; }
            return exercises.map(exerciseItem => {
                const layoutItem = layOutExerciseStore.find(layOutItem => layOutItem.id === exerciseItem.id);
                return {
                    ...exerciseItem,
                    oneRepeatMaximum: layoutItem ? layoutItem.oneRepeatMaximum : exerciseItem.oneRepeatMaximum
                };
            });
        }
        return result;
    }

    deleteMicroicleFromServer(microcicleId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/delete-microcicle-from-training-plan`,
                {
                    MicrocicleManager: {
                        microcicleId
                    }
                },
                {headers}
            );
        });
    }

    /** Метод генерирует масив наполненый указаными значениями */
    generateArrayOfValues(length: number, value: any) {
        const result = [];
        for (let i = 0; i < length; i++) {
            result[i] = value;
        }
        return result;
    }
}
