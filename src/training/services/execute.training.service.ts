import { Injectable } from '@angular/core';
import { BasePlanItemModel } from '../models/base.plan.item.model';
import { HandlePlanItemModel } from '../models/handle.plan.item.model';
import {UserMicrocicleItemModel, UserTrainingItemModel} from '../models/users.plan.data.model';
import { UsersPlanDataModel } from '../models/users.plan.data.model';
import {TrainingModel} from '../models/training.model';
import {MicrocicleModel} from '../models/microcicle.model';
import { MicrocicleService } from './microcicle.service';
import { LogService } from '../../common/log.service';

@Injectable()
export class ExecuteTrainingService {
    constructor(
        private microcicleService: MicrocicleService,
        private loger: LogService
    ) {}
    /** Метод конвертирует базовый тренировочный план в тренировочный план пригодный для выполнения тренировки */
    convertBasePlanToHandlePlan(basePlans: BasePlanItemModel [], userPlans: any []): HandlePlanItemModel [] {
        const result = [];
        basePlans.forEach(planItem => {
            if (planItem.repeatSection === 1) {
                const userPlan = userPlans.find(userItem => userItem.baseTrainingPlanId === planItem.id);
                result.push({
                    ...planItem,
                    doneWeight: userPlan ? userPlan.weight || 0 : 0,
                    doneRepeats: userPlan ? userPlan.repeats || 0 : 0,
                    doneRepeatSection: 1,
                    baseTrainingPlanId: userPlan ? userPlan.baseTrainingPlanId : planItem.id
                });
            }
            let currentUserPlans = userPlans.filter(userItem => userItem.baseTrainingPlanId === planItem.id);
            /** Сортируем по возрастанию опираясь на свойство order */
            currentUserPlans = currentUserPlans.sort((firstItem, secondItem) => {
                if (firstItem.order === secondItem.order) { return 0; }
                return firstItem.order > secondItem.order ? 1 : -1;
            });
            for (let i = 0; i < parseInt(`${planItem.repeats}`, 10); i++) {
                result[i] = {
                    ...planItem,
                    doneWeight: currentUserPlans && currentUserPlans[i] ? currentUserPlans[i].weight : 0,
                    doneRepeats: currentUserPlans && currentUserPlans[i] ? currentUserPlans[i].repeats : 0,
                    doneRepeatSection: 1,
                    baseTrainingPlanId: currentUserPlans && currentUserPlans[i] ? currentUserPlans[i].baseTrainingPlanId : planItem.id,
                    order: currentUserPlans && currentUserPlans[i] ? currentUserPlans[i].order || i + 1 : i + 1
                };
                /**
                 * Раскладки свыше первой здесь не обнуляються.
                 * Регулирование их отображения будет выполняться в plan-item
                 */
            }
        });
        return result;
    }
    /** Метод обрабатывает тренировку и преобразует тренировочные планы в ней */
    handleTraining(training: TrainingModel, userPlanStore: any []) {
        if (!training.exercises.length) { return training; }
        return {
            ...training,
            exercises: training.exercises.map(exerciseItem => {
                if (!exerciseItem.plans.length) { return exerciseItem; }
                return {
                    ...exerciseItem,
                    plans: this.convertBasePlanToHandlePlan(exerciseItem.plans, userPlanStore)
                };
            })
        };
    }
    /** Метод Обрабатывает микроцыкл */
    handleMicrocicle(microcicle: MicrocicleModel, userPlanStore: any []) {
        if (!microcicle.trainingData.length) { return false; }
        return {
            ...microcicle,
            trainingData: microcicle.trainingData.map(trainingItem => {
                return this.handleTraining(trainingItem, userPlanStore);
            })
        };
    }

    /** Метод собирает раскладки из всех тренировок и возвращает их в виде масива */
    // getAllPlans(store: UsersPlanDataModel []) {
    //     const result = [];
    //     if (store && store.length) {
    //         store.forEach(handleMicrocicle => {
    //             handleMicrocicle.microcicle.training.forEach(handleTraining => {
    //                 result.push(...handleTraining.plans);
    //             });
    //         });
    //     }
    //     return [...result];
    // }

    /**
     * Метод сравнивает раскладки полученые с сервера и заполненые пользователем
     * Возвращает раскладки для сохранения на сервер
     */
    compareExercisePlans(training: TrainingModel, usersPlansStore: any []) {
        const newItems = [];
        const modifiedItems = [];
        if (!training.exercises.length) { return null; }
        training.exercises.forEach(exerciseItem => {
            if (!exerciseItem.plans.length) { return; }
            exerciseItem.plans.forEach((planItem /* HandlePlanItemModel */) => {
                const userPlan = usersPlansStore.find(userItem => userItem.baseTrainingPlanId === planItem.id);
                /** Обрабатываем ситуацию когда пользовательская раскладка новая */
                if (!userPlan) {
                    newItems.push(this.createUserPlan(planItem));
                    return;
                }
                /** Обрабатываем ситуацию когда пользовательская раскладка измененная */
                if (!this.compareTwoPlans(userPlan, planItem)) {
                    modifiedItems.push({
                        ...this.createUserPlan(planItem),
                        id: userPlan.id
                    });
                }
            });
        });
        return {
            newItems: [...newItems],
            modifiedItems: [...modifiedItems]
        };
    }
    /** Метод создает раскладку для сохранения на сервер */
    createUserPlan(data: any /* UserPlanItemModel */) {
        return {
            baseTrainingPlanId: data.id,
            weight: parseInt(data.doneWeight, 10) || 0,
            repeats: parseInt(data.doneRepeats, 10) || 0,
            repeatSection: parseInt(data.doneRepeatSection, 10) || 0
        };
    }
    /** Метод сравнивает две раскладки (обе раскладки типа UserPlanItemModel) */
    compareTwoPlans(sourcePlan: any, modifyPlan: any) {
        let hasError = false;
        if (parseInt(sourcePlan.doneWeight, 10) !== parseInt(modifyPlan.doneWeight, 10)) { hasError = true; }
        if (parseInt(sourcePlan.doneRepeats, 10) !== parseInt(modifyPlan.doneRepeats, 10)) { hasError = true; }
        if (parseInt(sourcePlan.doneRepeatSection, 10) !== parseInt(modifyPlan.doneRepeatsSection, 10)) { hasError = true; }
        return !hasError;
    }
    /** Метод добавляет раскладку в выполненые */
    // addPlanToCompletedPlans(plan: any /* HandlePlanItemModel */, userPlansFromServer: UsersPlanDataModel [], microcicleId: number, trainingId: number) {
    //     this.log(microcicleId, 'MIcrocicle identifier inside which will be handled training');
    //     this.log(trainingId, 'Training identifier inside which will be handled training');
    //     const microcicle = userPlansFromServer.find(userPlanItem => userPlanItem.microcicle.id === microcicleId);
    //     if (microcicle) {
    //         this.log('Microcicle was founded', 'inside addPlanToCompletedPlans');
    //         const training = microcicle.microcicle.training.find(trainingItem => trainingItem.id === trainingId);
    //         if (training) {
    //             this.log('Training was founded', 'Inside addPlansInCompletedPlans');
    //             const userPlan = training.plans.find(planItem => planItem.baseTrainingPlanId === plan.id);
    //             return [
    //                 ...userPlansFromServer.filter(microcicleItem => microcicleItem.microcicle.id !== microcicleId),
    //                 {
    //                     ...microcicle,
    //                     training: [
    //                         ...microcicle.microcicle.training.filter(trainingItem => trainingItem.id !== trainingId),
    //                         {
    //                             ...training,
    //                             plans: [
    //                                 ...training.plans,
    //                                 {
    //                                     ...this.createUserPlan(plan),
    //                                     id: userPlan ? userPlan.id : this.microcicleService.generateId()
    //                                 }
    //                             ]
    //                         }
    //                     ]
    //                 }
    //             ];
    //         } else {
    //             this.log('Training not found', 'Inside addPlans to completed plans');
    //             /** Если нужной тренировки нету с вписке полученых с сервера то нужного плана так же нету */
    //             return [
    //                 ...userPlansFromServer.filter(microcicleItem => microcicleItem.microcicle.id !== microcicleId),
    //                 {
    //                     microcicle: {
    //                         id: microcicle.microcicle.id,
    //                         training: [
    //                             ...microcicle.microcicle.training, {
    //                                 training: this.createUserTrainingItem(trainingId, [{
    //                                     ...this.createUserPlan(plan),
    //                                     id: this.microcicleService.generateId()
    //                                 }])
    //                             }
    //                         ]
    //                     }
    //                 }
    //             ];
    //         }
    //     } else {
    //         this.log('Microcicle not found', 'Inside addPlanToCompletedPlans');
    //         /** Если микроцыкл не найден значит нужной раскладки в списке полученых с сервера точно нету */
    //         return [
    //             ...userPlansFromServer, {
    //                 microcicle: this.createUserMicrocicleItem(
    //                     microcicleId,
    //                     trainingId,
    //                     [{
    //                         ...this.createUserPlan(plan),
    //                         id: this.microcicleService.generateId()
    //                     }]
    //                 )
    //             }
    //         ];
    //     }
    // }
    // createUserMicrocicleItem(microcicleId: number, trainingId: number, plans: any []): UserMicrocicleItemModel {
    //     return {
    //             id: microcicleId,
    //             training: [this.createUserTrainingItem(trainingId, plans)]
    //     };
    // }
    // createUserTrainingItem(trainingId: number, plans: any []): UserTrainingItemModel {
    //     return {
    //         id: trainingId,
    //         plans
    //     };
    // }
    /** Метод обарабытвает тренировку как завершенную */
    // handleTrainingAsComplete(training: TrainingModel, usersPlans: UsersPlanDataModel [], microcicleId: number) {
    //     let tmpUsersPlans = usersPlans;
    //     training.exercises.forEach(exerciseItem => {
    //         if (!exerciseItem.plans && exerciseItem.plans.length) { return; }
    //         exerciseItem.plans.forEach(planItem => {
    //             tmpUsersPlans = this.addPlanToCompletedPlans(
    //                 planItem,
    //                 tmpUsersPlans,
    //                 microcicleId,
    //                 training.id
    //             );
    //         });
    //     });
    //     return tmpUsersPlans;
    // }

    /** Helpers */
    log(message: any, category = '') {
        if (category) {
            this.loger.log(message, category);
            return;
        }
        this.loger.log(message);
    }
}
