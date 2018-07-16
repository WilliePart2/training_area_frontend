import {IPadawanTrainingPlan} from '../../mentor/models/padawan.model';

export interface UserBaseModel {
    id: number;
    username: string;
    type: 'mentor' | 'user';
    avatar: string;
    mentor?: UserBaseModel;
}

export interface UserDisplayedModel extends UserBaseModel {
    rating: number;
}

export interface ExtendedUserModel extends UserDisplayedModel {
    trainings: UserTrainings;
    countPadawans?: number;
    // countTrainingPlans?: number;
}
interface UserTrainings {
    completedPlans?: IPadawanTrainingPlan [];
    currentPlan?: IPadawanTrainingPlan;
    ownPlans?: IPadawanTrainingPlan [];
}
