import { Component, OnInit, OnDestroy } from '@angular/core';
import * as Immutable from 'immutable';
import { Subscription } from 'rxjs/Subscription';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { SettingService } from '../../services/setting.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { FieldService } from '../../services/fields.service';

import { IImSettingFieldModel, ISettingFieldModel, IImListSettingFieldModels } from '../../models/setting.field.model';
import { MuttablePreparedSettingItems, PreparedSettingItems } from '../../models/prepared.setting.field.model';

@Component({
    selector: 'app-setting-contacts-component',
    templateUrl: './setting.contacts.component.html',
    providers: [FieldService]
})
export class SettingContactsComponent extends ProtectedComponent implements OnInit {
    _fieldsValue: PreparedSettingItems;
    set fieldsValue(val: PreparedSettingItems) {
        this._fieldsValue = val;
        this.items = {
            byGroup: val.byGroup ? val.byGroup.toJS() : null,
            groupless: val.groupless ? val.groupless.toJS() : null
        };
    }
    get fieldsValue() { return this._fieldsValue; }
    items: MuttablePreparedSettingItems;
    fieldSubscription: Subscription;
    constructor(
        protected userManager: UserManagerService,
        private settingService: SettingService,
        private fieldService: FieldService
    ) {
        super(userManager);
    }
    ngOnInit() {
        this.settingService.getFieldList().subscribe(response => {
            this.checkResponse(response, resp => {
                this.fieldsValue = this.settingService.prepareDataForDisplaying(
                    Immutable.fromJS(resp['data'])
                );
            });
        }, error => {
            // add "empty data" message
        });
        this.fieldSubscription = this.fieldService.initialize()
            .subscribe((newFieldObj: ISettingFieldModel) => {
                this.changeField(newFieldObj);
            });
    }
    changeField(newField: ISettingFieldModel) {
        this.fieldsValue = this.fieldService.updateFieldValue(this.fieldsValue, newField);
    }
}
