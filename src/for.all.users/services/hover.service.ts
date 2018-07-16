import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import * as actions from '../actions/hover.actions';

@Injectable()
export class HoverService {
    _observer: Observer<any>;
    $core: Observable<any>;
    constructor() {
        this.$core = Observable.create(observer => this._observer = observer);
    }
    init() {
        return this.$core;
    }
    setHover(elementIndex: number) {
        this._observer.next({
            type: actions.ADD_HOVER,
            payload: elementIndex
        });
    }
    removeHover(elementIndex: number) {
        this._observer.next({
            type: actions.REMOVE_HOVER,
            payload: elementIndex
        });
    }
}
