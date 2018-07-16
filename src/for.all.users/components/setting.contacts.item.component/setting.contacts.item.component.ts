import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { FieldService } from '../../services/fields.service';
import { SettingService } from '../../services/setting.service';

import { ISettingFieldModel } from '../../models/setting.field.model';

import { DimmerInterface } from '../../../common/interfaces/dimmer.interface';
import { SuiPopup, SuiPopupDirective } from 'ng2-semantic-ui/dist';

@Component({
    selector: 'app-setting-contacts-item',
    templateUrl: './setting.contacts.item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./setting.contacts.item.component.css']
})
export class SettingContactsItemComponent extends ProtectedComponent implements OnChanges, OnInit, DimmerInterface {
    @Input('fieldValue') fieldValue: ISettingFieldModel;
    isButtonShow: boolean;
    isEdit: boolean;
    valueEmpty: boolean;

    dimmed: boolean;
    dimmerMessage: string;

    pattern: RegExp;
    fieldErrorMessage: string;
    hasFieldError: boolean;
    constructor(
        private fieldService: FieldService,
        private cdr: ChangeDetectorRef,
        private settingService: SettingService,
        protected userManager: UserManagerService
    ) {
        super(userManager);
    }
    ngOnChanges() {
        if (this.fieldValue && !this.fieldValue.value) {
            this.valueEmpty = true;
        } else {
            this.valueEmpty = false;
        }
    }
    ngOnInit() {
        const rules = this.fieldService.getValidationRules();
        if (rules[this.fieldValue.label]) {
            this.pattern = rules[this.fieldValue.label]['pattern'];
            this.fieldErrorMessage = rules[this.fieldValue.label]['errorMessage'];
        } else {
            this.pattern = rules['common']['pattern'];
            this.fieldErrorMessage = rules['common']['errorMessage'];
        }
    }
    showButtons() {
        this.setState({isButtonShow: true});
    }
    hideButtons() {
        this.setState({isButtonShow: false});
    }
    startEdit() {
        this.setState({isEdit: true});
    }
    saveResult() {
        this.setState(this.enableDimmer.bind(this), 'Загрузка данных...');
        this.setState({isEdit: false});
        this.settingService.setNewFieldValue(
            this.fieldValue.value,
            parseInt(`${this.fieldValue.identifier}`, 10),
            this.valueEmpty,
            parseInt(`${this.fieldValue.recordId}`, 10)).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.fieldService.changeFieldValue(this.fieldValue);
                    this.setState(this.disableDimmer.bind(this));
                });
            }, error => {
                this.errorMessage('Ошибка соединения с сервером, данные не отправлены!');
                this.setState(this.disableDimmer.bind(this));
            });
    }

    setState(item: Function | object, ...args: any []) {
        if (typeof item === 'function') {
            if (args && args.length) {
                item(...args);
            } else {
                item();
            }
        } else {
            for (const prop in item) {
                if (typeof item[prop] === 'function') { continue; }
                if (!item.hasOwnProperty(prop)) { continue; }
                this[prop] = item[prop];
            }
        }
        this.cdr.detectChanges();
    }

    /** realithation dimmer interface */
    enableDimmer(msg: string) {
        this.dimmerMessage = msg ? msg : '';
        this.dimmed = true;
    }
    disableDimmer() {
        this.dimmerMessage = '';
        this.dimmed = false;
    }

    showError() {
        if (!this.hasFieldError) {
            this.setState({hasFieldError: true});
        }
        return true;
    }
    hideError() {
        if (this.hasFieldError) {
            this.setState({hasFieldError: false});
        }
    }
}
