import { Injectable } from '@angular/core';
import { LogService } from '../../common/log.service';

import { IImmutableBaseList } from '../models/immutable.base';
import { IImmutableMicrocicleModel } from '../models/microcicle.model';
import { IImmutableTrainingModel } from '../models/training.model';
import {
    ITrainingPlanUpdateResponse,
    ICreatedTraining,
    ICreatedExercises,
    ICreatedPlans,
    IUpdatedTraining
} from '../models/training.plan.update.response.model';
import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';
import { IImmutableBasePlanItemModel } from '../models/base.plan.item.model';

@Injectable()
export class AfterSaveService {
    constructor (private loger: LogService) {}
    /** Обновляем данные микроцыкла посе сохранения результатов редактирования на сервере */
    updateMicrocicleDataAfterResponse(
        responseData: ITrainingPlanUpdateResponse,
        dataForSave: IImmutableMicrocicleModel
    ) {
        let resultingMicrocicle: IImmutableMicrocicleModel = dataForSave;
        responseData.forEach((value, key) => {
            if (value && value.size) {
                value.forEach(data => {
                    /** Обновляем id если микроцикл новосозданный(работает) */
                    if (key === 'createdMicrocicles') {
                        if (data.get('previousMicrocicleId') === dataForSave.get('microcicleId')) {
                            resultingMicrocicle = <IImmutableMicrocicleModel>dataForSave.update('microcicleId', () => {
                                return data.get('microcicleId');
                            });
                        }
                    }
                    const newMicrocicleId = data.get('microcicleId');
                    resultingMicrocicle = <IImmutableMicrocicleModel> resultingMicrocicle.update('trainingData', tDataList => {
                        let tmpTDataList: IImmutableBaseList<IImmutableTrainingModel> = tDataList;

                        if (data.has('createdTrainings') && data.get('createdTrainings').size) {
                            tmpTDataList = <IImmutableBaseList<IImmutableTrainingModel>> tmpTDataList.map(tItem => {
                                return this.updateNewTrainingData(
                                    tItem,
                                    data.get('createdTrainings'),
                                    newMicrocicleId
                                );
                            });
                        }

                        if (data.has('updatedTrainings') && data.get('updatedTrainings').size) {
                            tmpTDataList = <IImmutableBaseList<IImmutableTrainingModel>>tmpTDataList.map(tItem => {
                                return this.updateOldTrainingData(tItem, data.get('updatedTrainings'));
                            });
                        }

                        return tmpTDataList;
                    });
                });
            }
        });
        return resultingMicrocicle;
    }
    updateNewTrainingData(
        training: IImmutableTrainingModel,
        dataForUpdate: IImmutableBaseList<ICreatedTraining>,
        microcicleId: number
    ) {
        const updatedTrainingItem = dataForUpdate.find(cTItem => {
            return cTItem.get('previousTrainingId') === training.get('id');
        });
        if (updatedTrainingItem) {
            const newTrainingId = updatedTrainingItem.get('trainingId');
            training = <IImmutableTrainingModel>training.withMutations(mTItem => {
                mTItem.update('id', () => newTrainingId)
                    .update('microcicleId', () => microcicleId)
                    .update('exercises', exItemList => {
                        return exItemList.map(exItem => {
                            return this.updateNewExerciseData(
                                exItem,
                                updatedTrainingItem.get('createdExercises'),
                                newTrainingId
                            );
                        });
                    });
            });
        }
        return training;
    }
    updateOldTrainingData(
        training: IImmutableTrainingModel,
        dataForUpdate: IImmutableBaseList<IUpdatedTraining>
    ) {
        const updatedTrainingItem = dataForUpdate.find(uTItem => {
            return uTItem.get('trainingId') === training.get('id');
        });
        if (updatedTrainingItem) {
            if (updatedTrainingItem.has('createdExercises')) {
                training = <IImmutableTrainingModel>training.update('exercises', exItemList => {
                    return exItemList.map(exItem => {
                        return this.updateNewExerciseData(
                            exItem,
                            updatedTrainingItem.get('createdExercises'),
                            training.get('id')
                        );
                    });
                });
            }
            if (updatedTrainingItem.has('updatedExercises')) {
                training = <IImmutableTrainingModel>training.update('exercises', exItemList => {
                    return exItemList.map(exItem => {
                        return this.updateOldExerciseData(
                            exItem,
                            updatedTrainingItem.get('updatedExercises')
                        );
                    });
                });
            }
        }
        return training;
    }
    updateNewExerciseData(
        exercise: IImmutableTrainingExerciseModel,
        dataForUpdate: IImmutableBaseList<ICreatedExercises>,
        trainingId: number
    ) {
        const updatedExerciseItem = dataForUpdate.find(cExItem => {
            return cExItem.get('previousUniqueId') === exercise.get('uniqueId');
        });
        if (updatedExerciseItem) {
            const exerciseUniqueId = updatedExerciseItem.get('exerciseUniqueId');
            exercise = <IImmutableTrainingExerciseModel>exercise.withMutations(mExItem => {
                mExItem.update('uniqueId', () => exerciseUniqueId)
                    .update('trainingId', () => trainingId)
                    .update('plans', pItemList => {
                        return pItemList.map(pItem => {
                            return this.updateNewPlanData(
                                pItem,
                                updatedExerciseItem.get('createdPlans'),
                                exerciseUniqueId
                            );
                        });
                    });
            });
        }
        return exercise;
    }
    updateOldExerciseData(
        exercise: IImmutableTrainingExerciseModel,
        dataForUpdate: IImmutableBaseList<ICreatedExercises>
    ) {
        const updatedExItem = dataForUpdate.find(uExItem => {
            return uExItem.get('exerciseUniqueId') === exercise.get('uniqueId');
        });
        if (updatedExItem && updatedExItem.has('createdPlans')) {
            exercise = <IImmutableTrainingExerciseModel>exercise.update('plans', pItemList => {
                return pItemList.map(pItem => {
                    return this.updateNewPlanData(
                        pItem,
                        updatedExItem.get('createdPlans'),
                        exercise.get('uniqueId')
                    );
                });
            });
        }
        return exercise;
    }
    updateNewPlanData(
        plan: IImmutableBasePlanItemModel,
        dataForUpdate: IImmutableBaseList<ICreatedPlans>,
        exerciseUniqueId: string
    ) {
        const updatedPlanItem = dataForUpdate.find(cPItem => cPItem.get('previousPlanId') === plan.get('id'));
        if (updatedPlanItem) {
            plan = plan.withMutations(mPlanItem => {
                mPlanItem.update('id', () => updatedPlanItem.get('planId'))
                    .update('exerciseId', () => exerciseUniqueId);
            });
        }
        return plan;
    }
}
