import { Component, Optional } from '@angular/core';
import { UserManagerService } from '../user.manager.service';
import { LogService } from '../log.service';

@Component({
    selector: 'app-common-public',
    template: '<div></div>'
})
export class ProtectedComponent {
    public hasError: boolean;
    public hasGlobalError: boolean;
    public hasEmptyData: boolean;
    /** Может определяться в компоненте для задания стандартного сообщения ошибки */
    public _errorMessage: string;
    /** Так же может определяться в компоненте для задания сообщения глобальной ошибки */
    public _globalErrorMessage: string;
    /** Текст сообщения о пустых данных */
    _emptyDataMessage: string;

    public step = 10;
    public _page = 1;
    public offset: number;
    public limit: number;
    public totalCount: number;

    /** Своства димера */
    public dimmed: boolean;
    public dimmerMessage: string;

    correctOffset(next?: boolean) {
        if (next === true) {
            this._page = this._page + 1;
        }
        this.offset = this.step * (this._page - 1);
    }

    constructor(protected userManager: UserManagerService) {
        // if (makeCheck === undefined) { makeCheck = true; }
        // if (makeCheck && !this.userManager.accessToken) { this.userManager.reloginUser(); }

        /** Иницыализируем свойства пагинации */
        this.offset = 0;
        this.totalCount = 0;
        this.limit = this.step;
    }

    public errorMessage(message: string = '') {
        this.hasError = true;
        this._errorMessage = message ? message : this._errorMessage;
    }
    public globalErrorMessage(message: string = '') {
        this.hasGlobalError = true;
        this._globalErrorMessage = message ? message : this._globalErrorMessage;
    }
    public resetErrorMessage() {
        this.hasError = false;
    }
    public resetGlobalErrorMessage() {
        this.hasGlobalError = false;
    }
    /** Управление сообщеним о пустых данных */
    public emptyDataMessage(message = '') {
        if (!message && this._emptyDataMessage) { message = this._emptyDataMessage; }
        this.hasEmptyData = true;
        this._emptyDataMessage = message;
    }
    public resetEmptyDataMessage() {
        this.hasEmptyData = false;
    }

    public checkError(response: any, errorMessage: string = '', emptyDataMessage = '') {
        if (!response) {
            if (errorMessage) {
                this.errorMessage(errorMessage);
                return false;
            } else {
                if (this._globalErrorMessage) {
                    this.hasGlobalError = true;
                } else {
                    if (this._errorMessage) { this.hasError = true; }
                }
                return false;
            }
        }
        if (!response.result) {
            if (emptyDataMessage) {
                this.emptyDataMessage(emptyDataMessage);
            } else {
                if (this._emptyDataMessage) {
                    this.emptyDataMessage();
                } else {
                    if (this._errorMessage) { this.hasError = true; }
                }
            }
            if (this.dimmed) {
                this.disableDimmer();
            }
            return false;
        }

        this.resetErrorMessage();
        this.resetGlobalErrorMessage();
        this.resetEmptyDataMessage();
        return true;
    }

    /** Метод пороверяет запрос и запускает функцию обрабатывающую его */
    public checkResponse(response , handlerFunc: any, argsForHandler: any = false) {
        const check = this.checkError(response);
        if (response) { this.userManager.reNewAccessToken(response['accessToken']); }
        if (!check) { return; }

        if (argsForHandler) {
            handlerFunc(argsForHandler);
        } else {
            handlerFunc(response);
        }

        if (this.hasError) { this.hasError = false; }
        if (this.hasGlobalError) { this.hasGlobalError = false; }
        if (this.hasEmptyData) {this.hasEmptyData = false; }
    }

    /** Методы управления димером */
    enableDimmer(message?: string) {
        this.dimmed = true;
        this.dimmerMessage = message || '';
    }
    disableDimmer() {
        this.dimmed = false;
        this.dimmerMessage = '';
    }
}

