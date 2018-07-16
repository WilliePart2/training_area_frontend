import { Training } from './training';

export class User {
    constructor(
        public username: string,
        public type: string,
        public trainings: number, // Количество тренировок,
        public mentor: string,
        public countPadawans: number,
        public countTrainingPlans: number
    ) { }
}
