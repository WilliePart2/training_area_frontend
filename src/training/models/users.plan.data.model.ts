import { IListPlansForPerformModel } from './plan.for.perform.model';

export class UsersPlanDataModel {
    constructor(
        public microcicle: UserMicrocicleItemModel
    ) {}
}
export class UserMicrocicleItemModel {
    constructor(
        public id: number, /* microcicle id ? */
        public training: UserTrainingItemModel []
    ) {}
}
export class UserTrainingItemModel {
    constructor(
        public id: number, /* training id */
        public plans: IListPlansForPerformModel
    ) {}
}
