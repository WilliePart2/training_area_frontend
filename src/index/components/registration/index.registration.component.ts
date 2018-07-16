import { Component, ViewChild, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { LogService } from '../../../common/log.service';
import { AuthorizationService } from '../../services/authorization.service';
import { AuthResponse } from '../../models/AuthResponse';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { RegistrationCommonLabels } from '../../../common/models/registration.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import {passBoolean} from 'protractor/built/util';


@Component({
    selector: 'app-index-registration',
    templateUrl: './index.registration.component.html'
})

export class IndexRegistrationComponent extends ProtectedComponent implements OnInit {
    name: string;
    password: string;
    repeatPassword: string;
    email: string;
    group: string;
    selectedGroup = false;
    passwordValid = false;
    showErrorMessage = false;
    registrationProcess: boolean;
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';

    _commonLabels: RegistrationCommonLabels;
    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    constructor(
        private logService: LogService,
        private authService: AuthorizationService,
        protected userManager: UserManagerService,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.REGISTRATION_COMMON_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
    }

    /** Отпавка формы */
    onSubmit() {
        if (this.registrationProcess) { return; }
        if (this.name && this.password && this.repeatPassword && this.email && this.group && this.passwordValid) {
            this.registrationProcess = true;
            this.enableDimmer(this._dimmerLabels.SENDING_REQUEST);
            this.authService[this.group === 'mentor' ? 'registrationMentor' : 'registrationUser'](this.name, this.email, this.password, this.repeatPassword)
                .subscribe((response: AuthResponse) => {
                    this.resetForm();
                    if (response && response.result) {
                        if (response.data === this.USER_ALREADY_EXISTS) {
                            this.errorMessage(this._errorLabels.REGISTRATION_USER_ALREADY_EXISTS);
                        } else {
                            /** Устанавливаем учетные данные пользователя */
                            this.userManager.saveAccessToken(response.accessToken, response.expire);
                            this.userManager.username = response.username;
                            this.userManager.type = <'mentor' | 'user'>response.type;
                            this.userManager.id = response.id;
                            /** Перенаправляем пользователя в кабинет */
                            this.userManager.redirectUser(this.group === 'mentor' ? 'mentor' : 'user');
                        }
                    } else {
                        this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
                    }
                    if (response && !response.result) {
                        this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
                    }
                    this.registrationProcess = false;
                    this.disableDimmer();
                }, _ => {
                    this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
                    this.registrationProcess = false;
                    this.disableDimmer();
                });
            return;
        }
    }
    /** Устанавливает флаг указывающий что пользователь выбрал группу в которой зарегистрироваться */
    selectGroup() {
        this.selectedGroup = true;
    }
    /** Проверяет совпадение паролей */
    validatePassword() {
        const repeatPasswordRegExp = new RegExp(`${this.repeatPassword}`);
        const passwordRegExp =  new RegExp(`${this.password}`);
        if (this.password.search(repeatPasswordRegExp) !== -1 && this.repeatPassword.search(passwordRegExp) !== -1) {
            console.log('password valid');
            this.passwordValid = true;
        } else {
            console.log('password invalid');
            this.passwordValid = false;
        }
    }
    /** Сбрасывает форму входа */
    resetForm() {
        this.name = '';
        this.email = '';
        this.password = '';
        this.repeatPassword = '';
    }
}
