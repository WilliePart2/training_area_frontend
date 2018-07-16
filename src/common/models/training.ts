import { TrainingPlan } from './training.plan';

export class Training {
    constructor(
        public exerciseName: string,
        public pm: number,
        public trainingPlans: TrainingPlan []
    ) { }
}
