import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Observer } from 'rxjs/Observer';

import * as actions from '../actions/total.message.actions';

@Injectable()
export class TotalMessageService implements OnDestroy {
    $core: Observable<any>;
    _observer: Observer<any>;

    defaultErrorMessage: string;
    constructor() {
        this.$core = Observable.create(observer => {
            this._observer = observer;
        });
        this.defaultErrorMessage = 'Действие не удалось';
    }
    ngOnDestroy() {
        /** Do problems may happen in this place? */
        this.$core = null;
        this._observer = null;
    }
    getCore() {
        return this.$core;
    }
    getMessageConfig() {
        const messageWidth = 400;
        return {
            duration: 3000,
            style: {
                width: `${messageWidth}px`
            },
        };
    }
    getMessageContainerConfig() {
        return {
            style: {
                position: 'fixed',
                left: '20px',
                bottom: '20px'
            }
        };
    }
    sendMessage(msg: string) {
        this._observer.next({
            type: actions.MESSAGE,
            data: msg
        });
    }
    sendErrorMessage(msg?: string) {
        this._observer.next({
            type: actions.ERROR_MESSAGE,
            data: msg || this.defaultErrorMessage
        });
    }
    sendSuccessMessage(msg: string) {
        this._observer.next({
            type: actions.SUCCESS_MESSAGE,
            data: msg
        });
    }
}
