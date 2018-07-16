import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as Immutable from 'immutable';

import { ISettingFieldModel, IImSettingFieldModel } from '../models/setting.field.model';
import { PreparedSettingItems, GroupedItems } from '../models/prepared.setting.field.model';
import { IImmutableBaseList, IImmutableBaseMap } from '../../training/models/immutable.base';

@Injectable()
export class FieldService {
    subject: Subject<any>;
    initialize() {
        this.subject = new Subject();
        return this.subject;
    }
    changeFieldValue(val: ISettingFieldModel) {
        this.subject.next(val);
    }
    updateFieldValue(store: PreparedSettingItems, fieldObj: ISettingFieldModel): PreparedSettingItems {
        const imFieldObj = Immutable.fromJS(fieldObj);
        if (store && store.byGroup) {
            store.byGroup = <GroupedItems> this.mapFieldItems(store, imFieldObj, 'byGroup');
        }
        if (store && store.groupless) {
            store.groupless = this.mapFieldItems(store, imFieldObj, 'groupless');
        }
        return store;
    }
    mapFieldItems(store: PreparedSettingItems, fieldObj: IImmutableBaseMap<ISettingFieldModel>, prop: string) {
        return store[prop] = store[prop].map(itemList => {
            if (itemList && itemList.size) {
                itemList = <IImmutableBaseList<any>> itemList.map(groupedItem => {
                    if (typeof groupedItem === 'string') { return groupedItem; }
                    if (groupedItem && groupedItem.has('identifier')
                        && groupedItem.get('identifier') === fieldObj.get('identifier')) {
                            return fieldObj;
                        }
                    return groupedItem;
                });
            }
            return itemList;
        });
    }
    getValidationRules() {
        const message = 'Поле заполнено некорректно';
        const commonPattern = /[-_\w]+/;
        return {
            Viber: this.createValidationRule(/\+?\w+$/, message),
            Telegram: this.createValidationRule(/\+?[-_\w]+$/, message),
            WhatsApp: this.createValidationRule(/\+[-_\w]+$/, message),
            Skype: this.createValidationRule(/\+[-_\w]+$/, message ),
            VKontakte: this.createValidationRule(/(https?:\/\/)?(www)?(m\.)?vk.com\/[\?=-_\w]+$/, message),
            Facebook: this.createValidationRule(/(https?:\/\/)?(www)?([a-zA-Z]*\.)?facebook.com\/[\?=-_\w]+$/, message),
            Youtube: this.createValidationRule(/[-_\w]+/, message),
            common: this.createValidationRule(commonPattern, message)
        };
    }
    createValidationRule(pattern: RegExp, errorMessage: string) {
        return {
            pattern,
            errorMessage
        };
    }
}
