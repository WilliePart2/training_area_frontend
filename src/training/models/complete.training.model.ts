import { IPlanForPerformMutableModel } from './plan.for.perform.model';

export interface ICompleteTraining {
    plans: {
        [key: string]: Array<IPlanForPerformMutableModel>
    };
    trainingPlanId: number;
    trainingSessionId: string;
    trainingId: number;
}
