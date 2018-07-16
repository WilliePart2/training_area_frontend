import { IImmutableBaseList } from '../../training/models/immutable.base';
import { IImSettingFieldModel, ISettingFieldModel } from './setting.field.model';

export type GroupedItems = IImmutableBaseList<IImmutableBaseList<any>>;
export interface PreparedSettingItems {
    byGroup: GroupedItems;
    groupless: IImmutableBaseList<IImSettingFieldModel>;
}
export interface MuttablePreparedSettingItems {
    byGroup: Array<Array<any>>;
    groupless: Array<ISettingFieldModel>;
}
