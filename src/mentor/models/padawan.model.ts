import { IImmutableBaseList, IImmutableBaseMap } from '../../training/models/immutable.base';

export interface IPadawanModel {
    id: number;
    sessionId: string;
    avatar: string;
    username: string;
    trainings: {
        completedPlans: Array<IPadawanTrainingPlan>;
        currentPlan: IPadawanTrainingPlan;
    };
}

export interface IPadawanTrainingPlan {
    id: number;
    name: string;
    sessionId?: string;
    readme?: string;
    rating?: number;
    category: 0 | 1 | 2 | 3 | 'Без категории' | 'Для новичков' | 'Для среднего уровня' | 'Для высокого уровня';
}

export interface IPadawanListModel extends Array<IPadawanModel> {}

export interface IImPadawanModel extends IImmutableBaseMap<IPadawanModel> {}

export interface IImPadawanListModel extends IImmutableBaseList<IImPadawanModel> {}
