import { Injectable } from '@angular/core';
import * as Immutable from 'immutable';

import { IImmutableBaseList } from '../models/immutable.base';
import { IImmutableBasePlanItemModel } from '../models/base.plan.item.model';
import { IImmutableTrainingExerciseModel } from '../models/training.exercise.model';

export class ExerciseService {
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
    addPlan(oldExercise: IImmutableTrainingExerciseModel, errorCallback: Function) {
        return oldExercise.update('plans', oldPlans => {
            const itemForAdd = oldPlans.first();
            if (!this.validatePlan(itemForAdd)) {
                errorCallback();
                return oldPlans;
            }
            oldPlans = oldPlans.shift();
            oldPlans = oldPlans.push(itemForAdd);
            oldPlans = oldPlans.unshift(this.createPlan(oldExercise.get('uniqueId'), 0, 0, 0));
            return oldPlans;
        });
    }
    /* Может этот метод не нужен вовсе? */
    deletePlan(exercise: IImmutableTrainingExerciseModel, planIndex: number) {
        return exercise.update('plans', oldPlans => {
            return oldPlans.delete(planIndex);
        });
    }
    /* deprecated */
    updatePlan(
        oldPlansStore: IImmutableBaseList<IImmutableBasePlanItemModel>,
        planId: number,
        newItem: IImmutableBasePlanItemModel
    ) {
        return oldPlansStore.map(planItem => {
            if (planItem.get('id') !== planId) { return newItem; }
            return planItem;
        });
    }
    updatePlanProperty(oldExercise: IImmutableTrainingExerciseModel, planIndex: number, property: string, value: any) {
        return oldExercise.update('plans', oldPlans => {
            if (!oldPlans || !oldPlans.size) { return oldExercise; }
            return oldPlans.update(planIndex, oldPlanItem => {
                return oldPlanItem.update(property, () => value);
            });
        });
    }
    checkNewPlan(exercise: IImmutableTrainingExerciseModel) {
        let result = false;
        const checkedPlanItem = exercise.get('plans').first();
        if (parseInt(checkedPlanItem.get('weight'), 10)) { result = true; }
        if (parseInt(checkedPlanItem.get('repeats'), 10)) { result = true; }
        if (parseInt(checkedPlanItem.get('repeatSection'), 10)) { result = true; }
        return result;
    }
    validatePlan(plan: IImmutableBasePlanItemModel) {
        if (!plan) { return false; }
        if (!parseInt(plan.get('weight'), 10)) { return false; }
        if (!parseInt(plan.get('repeats'), 10)) { return false; }
        if (!parseInt(plan.get('repeatSection'), 10)) { return false; }
        return true;
    }
    generateId(): number {
        return Math.round(Number(`${Date.now()}${Math.random() * 10}`));
    }
}
