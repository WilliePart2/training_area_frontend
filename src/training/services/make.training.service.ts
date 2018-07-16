import { Injectable } from '@angular/core';
import * as Immutable from 'immutable';

import { IImmutableTrainingModel, IImExecutableTrainingModel } from '../models/training.model';
import { IImmutableBasePlanItemModel, ExecutableBasePlanItemModel } from '../models/base.plan.item.model';
import { IPlanForPerformModel, IListPlansForPerformModel } from '../models/plan.for.perform.model';
import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';
import { IImPerformItemListFromResponse, IImPerformItemFromResponse } from '../models/perform.item.response.model';

@Injectable()
export class MakeTrainingService {
    /** Группа методов подготавливает тренировку к выполнению */
    prepareTrainingForPerform(training: IImmutableTrainingModel): IImExecutableTrainingModel {
        return <IImExecutableTrainingModel>training.update('exercises', exItemList => {
            return exItemList.map(exItem => {
                return exItem.update('plans', planItemList => {
                    return planItemList.map(planItem => {
                        return this.preparePlanForPerform(planItem);
                    });
                });
            });
        });
    }
    preparePlanForPerform(planItem: IImmutableBasePlanItemModel): ExecutableBasePlanItemModel {
        let data;
        const repeatSections = planItem.get('repeatSection');
        if (repeatSections === 1) {
            data = planItem.set('dataForPerform', Immutable.List.of(
                this.createPerformItem(planItem)
            ));
        } else {
            data = planItem.withMutations(item => {
                for (let i = 0; i < repeatSections; i++) {
                    if (i < 1) {
                        item.set('dataForPerform', Immutable.List.of(this.createPerformItem(planItem, i)));
                        continue;
                    }
                    item.update('dataForPerform', oldData => {
                        return oldData.push(this.createPerformItem(planItem, i));
                    });
                }
            });
        }
        return data;
    }
    createPerformItem(planItem: IImmutableBasePlanItemModel, order?: number): IPlanForPerformModel {
        let result = Immutable.Map();
        result = result.withMutations(item => {
            item.set('id', this.generateId())
                .set('parentPlanId', planItem.get('id'))
                .set('planWeight', planItem.get('weight'))
                .set('planRepeats', planItem.get('repeats'))
                .set('planRepeatSection', planItem.get('repeatSection'))
                .set('doneWeight', 0)
                .set('doneRepeats', 0)
                .set('doneRepeatSection', 1)
                .set('isComplete', false)
                .set('isFullDone', false)
                .set('order', order ? order : 0);
        });
        return <IPlanForPerformModel>result;
    }
    preparePlanForEdit(training: IImmutableTrainingModel, completedPlans: IListPlansForPerformModel) {
        return training.update('exercises', exItemList => {
            return exItemList.map(exItem => {
                return exItem.update('plans', planItemList => {
                    return planItemList.map(planItem => {
                        let completedItems = completedPlans.filter(compItem => {
                            return compItem.get('parentPlanId') === planItem.get('id');
                        });
                        if (completedItems && completedItems.size) {
                            completedItems = completedItems.sort((val1: IPlanForPerformModel, val2: IPlanForPerformModel) => {
                                if (val1.get('order') > val2.get('order')) { return 1; }
                                if (val1.get('order') < val2.get('order')) { return -1; }
                                if (val1.get('order') === val2.get('order')) { return 0; }
                            });
                            completedItems = completedItems.map(completeItem => {
                                completeItem = completeItem.withMutations(mCompleteItem => {
                                    mCompleteItem.update('isComplete', () => true);
                                    mCompleteItem.update('isFullDone', () => this.checkFullDone(completeItem));
                                });
                                return completeItem;
                            });
                            planItem = planItem.set('dataForPerform', completedItems);
                        }
                        return planItem;
                    });
                });
            });
        });
    }
    removeDataForPerformFromTraining(training: IImmutableTrainingModel) {
        return training.update('exercises', exItemList => {
            return exItemList.map(exItem => {
                return exItem.update('plans', planItemList => {
                    return planItemList.map(planItem => {
                        if (planItem.has('dataForPerform')) {
                            planItem = planItem.delete('dataForPerform');
                        }
                        return planItem;
                    });
                });
            });
        });
    }
    generateId() {
        return Math.round(Date.now() / Math.random());
    }
    createBooleanArray(length: number, flag?: boolean) {
        const result = [];
        if (flag === undefined) { flag = false; }
        for (let i = 0; i < length; i++) {
            result.push(flag);
        }
        return result;
    }
    setDoneProperty(exercise: IImmutableTrainingExerciseModel, prop: string, value: number, planPartId: number) {
        return exercise.update('plans', planItemList => {
            return planItemList.map(planItem => {
                return planItem.update('dataForPerform', perfItemList => {
                    return perfItemList.map(perfItem => {
                        if (perfItem.get('id') === planPartId) {
                            perfItem = perfItem.update(`done${prop}`, () => value);
                        }
                        return perfItem;
                    });
                });
            });
        });
    }
    setPlanPartAsComplete(exercise: IImmutableTrainingExerciseModel, performPlanId: number) {
        return exercise.update('plans', planItemList => {
            return planItemList.map(planItem => {
                planItem = planItem.update('dataForPerform', performPlanItemList => {
                    return performPlanItemList.map(performPlanItem => {
                        if (performPlanItem.get('id') === performPlanId) {
                            return performPlanItem.withMutations(performPlanMItem => {
                                performPlanMItem.update('isComplete', () => true)
                                                .update('isFullDone', () => {
                                                    return this.checkFullDone(performPlanItem);
                                                });
                            });
                        }
                        return performPlanItem;
                    });
                });
                return planItem;
            });
        });
    }
    /** метод проверяет коректно ли выполнена раскладка */
    checkFullDone(planPart: IPlanForPerformModel) {
        let result = true;
        if (parseInt(planPart.get('planWeight'), 10) !== parseInt(planPart.get('doneWeight'), 10)) {
            result = false;
        }
        if (parseInt(planPart.get('planRepeats'), 10) !== parseInt(planPart.get('doneRepeats'), 10)) {
            result = false;
        }
        return result;
    }
    /** метод проветяет выполнено ли упражнение */
    checkExercisePerforming(exercise: IImmutableTrainingExerciseModel) {
        let result = true;
        if (exercise.has('plans')) {
            exercise.get('plans').forEach(planItem => {
                if (planItem.has('dataForPerform')) {
                    planItem.get('dataForPerform').forEach(perfItem => {
                        if (!perfItem.get('isComplete')) {
                            result = false;
                            return false;
                        }
                    });
                } else {
                    result = false;
                }
            });
        } else {
            result = false;
        }
        return result;
    }
    checkTrainingPerforming(training: IImmutableTrainingModel) {
        let result = true;
        if (training.has('exercises')) {
            training.get('exercises').forEach(exerciseItem => {
                if (!this.checkExercisePerforming(exerciseItem)) {
                    result = false;
                    return false;
                }
            });
        } else {
            result = false;
        }
        return result;
    }
    getAllPerfPlansFromTraining(training: IImmutableTrainingModel): IListPlansForPerformModel {
        let plans = Immutable.List();
        plans = plans.withMutations(mPlans => {
            training.get('exercises').forEach(exItem => {
                exItem.get('plans').forEach(planItem => {
                    planItem.get('dataForPerform').forEach(perfItem => {
                        mPlans.push(perfItem);
                    });
                });
            });
        });
        return <IListPlansForPerformModel>plans;
    }
    /** Обновляем идентификаторы раскладок для выполнения */
    updateIdInPerformItems(items: IListPlansForPerformModel, dataFromServer: IImPerformItemListFromResponse): IListPlansForPerformModel {
        return <IListPlansForPerformModel>items.map((item: IPlanForPerformModel) => {
            const responseItem = dataFromServer.find(dataItem => {
                return dataItem.get('previousPerformPlanId') === item.get('id');
            });
            if (responseItem) {
                item = item.update('id', () => responseItem.get('newPerformPlanId'));
            }
            return item;
        });
    }
    mergeCompletedUserPlans(
        oldCompletedPlans: IListPlansForPerformModel,
        newCompletedPlans: IListPlansForPerformModel
    ): IListPlansForPerformModel {
        return <IListPlansForPerformModel>oldCompletedPlans.map(oldCompItem => {
            const newCompleteItem = newCompletedPlans.find(newCompItem => {
                return newCompItem.get('id') === oldCompItem.get('id');
            });
            if (newCompleteItem) {
                return newCompleteItem;
            }
            return oldCompItem;
        });
    }
}
