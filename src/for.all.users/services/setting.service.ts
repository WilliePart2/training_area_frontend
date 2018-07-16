import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Immutable from 'immutable';
import { BaseService } from '../../common/base.service';
import { UserManagerService } from '../../common/user.manager.service';
import { UrlService } from '../../common/url.service';

import { IImListSettingFieldModels, IImSettingFieldModel, ISettingFieldModel } from '../models/setting.field.model';
import { IImmutableBaseList } from '../../training/models/immutable.base';
import { PreparedSettingItems, MuttablePreparedSettingItems, GroupedItems } from '../models/prepared.setting.field.model';

@Injectable()
export class SettingService extends BaseService {
    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private url: UrlService
    ) {
        super(userManager, http);
    }
    getAvatarList() {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.url.getMentorSetting()}/get-available-avatars`,
                {headers}
            );
        });
    }
    setAvatar(avatarUrl: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorSetting()}/set-avatar-as-current`,
                {
                    AvatarManager: {
                        url: avatarUrl
                    }
                },
                {headers}
            );
        });
    }
    getFieldList() {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.url.getMentorSetting()}/get-available-fields-list`,
                {headers}
            );
        });
    }
    setNewFieldValue(value: string, fieldId: number, isFirstInsert: boolean, recordId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorSetting()}/set-user-info-field`,
                {
                    UserInfoManager: {
                        fieldId,
                        value,
                        isFirstInsert,
                        recordId
                    }
                },
                {headers}
            );
        });
    }
    /** Методы для подготовки данных к отображению */
    prepareDataForDisplaying(data: IImListSettingFieldModels) {
        let categories: PreparedSettingItems = <PreparedSettingItems>{};
        data.forEach((item: IImSettingFieldModel) => {
            const group = item.get('group');
            if (group) {
                categories = this.addGroupedData(categories, item);
            } else {
                categories = this.addUngroupedData(categories, item);
            }
        });
        return categories;
    }
    addGroupedData(store: PreparedSettingItems, item: IImSettingFieldModel): PreparedSettingItems {
        if (store.byGroup && store.byGroup.size) {
            let groupFinded = false;
            store.byGroup = <GroupedItems>store.byGroup.map(groupItem => {
                const groupName = groupItem.get(0); // В нулевом элементе храниться имя группы
                if (groupName === item.get('group')) {
                    groupItem = groupItem.push(item);
                    groupFinded = true;
                }
                return groupItem;
            });
            if (!groupFinded) {
                store = this.addNewGroup(store, item);
            }
        } else {
            store.byGroup = Immutable.List.of(
                Immutable.List.of(item.get('group'), item)
            );
        }
        return store;
    }
    addNewGroup(store: PreparedSettingItems, item: IImSettingFieldModel) {
        store.byGroup = store.byGroup.push(Immutable.List.of(
            item.get('group'),
            item
        ));
        return store;
    }
    addUngroupedData(store: PreparedSettingItems, item: IImSettingFieldModel): PreparedSettingItems {
        if (store.groupless && store.groupless.size) {
            store.groupless = store.groupless.push(item);
        } else {
            store.groupless = Immutable.List.of(item);
        }
        return store;
    }
}
