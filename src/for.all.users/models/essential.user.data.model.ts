import { ISettingFieldModel } from './setting.field.model';
import { UserBaseModel } from '../../common/models/user.base.model';

export interface EssentialUserDataModel {
    id: number;
    username: string;
    type: number;
    avatar: string;
    rating: number;
    followedId: number;
    contacts: Array<ISettingFieldModel>;
    relations: Array<IRelationUsers>;
}

export type IRelationUsers = UserBaseModel;
