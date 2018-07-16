import { MicrocicleModel } from './microcicle.model';
import { TrainingModel } from './training.model';
import { TrainingExerciseModel } from './training.exercise.model';
import { BasePlanItemModel } from './base.plan.item.model';

export class DeletingDataModel {
    constructor(
        public microcicles: MicrocicleModel [],
        public trainings: TrainingModel [],
        public exercises: TrainingExerciseModel [],
        public plans: BasePlanItemModel []
    ) {}
}
