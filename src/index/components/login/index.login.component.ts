import { Component, ViewChild, OnInit } from '@angular/core';
import { AuthorizationService } from '../../services/authorization.service';
import { AuthResponse } from '../../models/AuthResponse';
import { UserManagerService } from '../../../common/user.manager.service';
import { LogService } from '../../../common/log.service';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { LoginCommonLabels } from '../../../common/models/login.common.labels';

@Component({
    selector: 'app-index-login',
    templateUrl: './index.login.component.html'
})

export class IndexLoginComponent implements OnInit {
    groupSelected: boolean = false;
    name: string = '';
    password: string = '';
    group: string = '';
    loginError: boolean = false;

    dimmed: boolean;
    dimmerMessage: string;

    showErrorDimmer: boolean;
    dimmerErrorMessage: string;

    _commonLabels: LoginCommonLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        private authorizationService: AuthorizationService,
        private userService: UserManagerService,
        private logService: LogService,
        private labelService: LabelService
    ) { }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.LOGIN_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
    }

    onSubmit() {
        const dimmerMessage = 'Обработка запроса...';
        // if (this.group === 'mentor') {
            this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
            this.authorizationService[this.group === 'mentor' ? 'authorizationMentor' : 'authorizationUser'](this.name, this.password)
                .subscribe((response: AuthResponse) => {
                    if (response && response.result) {
                        /** Устанавливаем учетные данные пользователя */
                        this.userService.saveAccessToken(response.accessToken, response.expire);
                        this.userService.username = response.username;
                        this.userService.type = <'mentor' | 'user'>response.type;
                        this.userService.id = response.id;
                        this.userService.avatar = response.avatar;
                        /** Перенаправляем пользователя в рабочий кабинет */
                        this.userService.redirectUser(this.group === 'mentor' ? 'mentor' : 'user');
                        this.disableDimmer();
                    } else {
                        this.password = '';
                        this.loginError = true;
                        this.disableDimmer();
                    }
                }, error => {
                    this.disableDimmer();
                    this.enableDimmer(this._errorLabels.LOGIN_USER_NOT_FINDED, true);
                });
        // }
        // } else {
        //     this.enableDimmer(dimmerMessage);
        //     this.authorizationService.authorizationUser(this.name, this.password).subscribe((response: AuthResponse) => {
        //         if (response.result) {
        //             /** Кстанавливаем учетные данные пользователя */
        //             this.userService.saveAccessToken(response.accessToken, response.expire);
        //             this.userService.username = response.username;
        //             this.userService.type = <'mentor' | 'user'>response.type;
        //             this.userService.id = response.id;
        //             this.userService.avatar = response.avatar;
        //             /** Перенаправляем пользователя */
        //             this.userService.redirectUser('user');
        //             this.disableDimmer();
        //         } else {
        //             this.password = '';
        //             this.loginError = true;
        //             this.enableDimmer('');
        //         }
        //     }, error => {
        //         this.disableDimmer();
        //         this.enableDimmer(this._errorLabels.LOGIN_USER_NOT_FINDED, true);
        //     });
        // }
    }
    selectGroup() {
        this.groupSelected = true;
    }
    enableDimmer(msg?: string, isError?: boolean) {
        const message = msg ? msg : '';
        if (!isError) {
            this.dimmed = true;
            this.dimmerMessage = message;
        } else {
            this.showErrorDimmer = true;
            this.dimmerErrorMessage = message;
        }
    }
    disableDimmer(isError?: boolean) {
        if (!isError) {
            this.dimmed = false;
            this.dimmerMessage = '';
        } else {
            this.showErrorDimmer = false;
            this.dimmerErrorMessage = '';
        }
    }

    /** Метод перенаправдения пользователья в рабочий кабинет */
    redirectUser(route) {
        // this.router.navigate([`/${route}`]);
    }
}
