import { IImmutableBaseMap, IImmutableBaseList } from '../../training/models/immutable.base';

export interface IImSettingFieldModel extends IImmutableBaseMap<ISettingFieldModel> {}
export interface ISettingFieldModel {
    identifier: number;
    label: string;
    group: string;
    icon: string;
    value: string;
    recordId: number;
}

export interface IImListSettingFieldModels extends IImmutableBaseList<IImSettingFieldModel> {}
