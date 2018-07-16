import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as Immutable from 'immutable';
import { ISettingFieldModel } from '../../models/setting.field.model';
import { SettingService } from '../../services/setting.service';

@Component({
    selector: 'app-user-page-contacts',
    templateUrl: './user.page.contact.component.html',
    styleUrls: ['./user.page.contact.component.css'],
    providers: [SettingService]
})
export class UserPageContactComponent implements OnInit, OnChanges {
    @Input('contacts') contacts: Array<ISettingFieldModel>;
    groupedContacts: Array<Array<any>>;
    ungroupedContacts: Array<ISettingFieldModel>;
    constructor(private settingService: SettingService) {}
    ngOnInit() {
        this.prepareData();
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.contacts && changes.contacts.currentValue !== changes.contacts.previousValue) {
            this.prepareData();
        }
    }
    prepareData() {
        console.log(this.contacts);
        if (this.contacts) {
            const data = this.settingService.prepareDataForDisplaying(Immutable.fromJS(this.contacts));
            if (data && data.byGroup) {
                this.groupedContacts = data.byGroup.toJS();
            }
            if (data && data.groupless) {
                this.ungroupedContacts = data.groupless.toJS();
            }
        }
    }
}
