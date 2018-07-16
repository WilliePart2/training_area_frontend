import {Component, OnDestroy, OnInit} from '@angular/core';
import {ProtectedComponent} from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import {Observer} from 'rxjs/Observer';
import {Subject} from 'rxjs/Subject';
import {ActionModel} from '../../../common/models/action.model';
import {UserViewActions} from '../../models/user.view.actions';
import { fromEvent } from 'rxjs/observable/fromEvent';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {ScrollActionModel} from '../../../common/models/scroll.action.model';
import {ScrollTypes} from '../../../common/models/scroll.action.model';
import {ExtendedUserModel} from '../../../common/models/user.base.model';

@Component({
    selector: 'app-user-manipulate-base-component',
    templateUrl: 'user-manipulate-base-component.component.html'
})

export class UserManipulateBaseComponent extends ProtectedComponent implements OnInit, OnDestroy {
    public _userConfigObserver: Observer<ActionModel>;
    get userConfigObserver() { return this._userConfigObserver; }

    observableWindowScroll: Subject<any>;
    _scrollSubscription: Subscription;

    constructor(
        protected userManager: UserManagerService
    ) {
        super(userManager);
    }

    ngOnInit() {
        this._userConfigObserver = new Subject();
        this.observableWindowScroll = new Subject();
        this._startWindowScrollObservable(this.observableWindowScroll);
    }

    ngOnDestroy() {
        if (this._scrollSubscription) { this._scrollSubscription.unsubscribe(); }
    }

    enableUserDimmer(userId: number) {
        this._userConfigObserver.next({
            type: UserViewActions.SHOW_DIMMER,
            data: userId
        });
    }

    disableUserDimmer(userId: number) {
        this._userConfigObserver.next({
            type: UserViewActions.HIDE_DIMMER,
            data: userId
        });
    }

    protected _startWindowScrollObservable(observer: Observer<ScrollActionModel>, minimalHeightToLoad?: number) {
        let previousScrollValue = 0;
        this._scrollSubscription = fromEvent(window, 'scroll').subscribe((event: Event) => {
            if (!minimalHeightToLoad) {
                minimalHeightToLoad = 50;
            }
            const viewHeight = document.documentElement.clientHeight;
            const contentHeight = Math.max(
                document.documentElement.clientHeight, document.body.clientHeight,
                document.documentElement.offsetHeight, document.body.offsetHeight,
                document.documentElement.scrollHeight, document.body.scrollHeight
            );
            const offset = pageYOffset;
            if (contentHeight - (viewHeight + offset) < minimalHeightToLoad) {
                observer.next({
                    type: (function() {
                        const scrollType = previousScrollValue < offset ? ScrollTypes.SCROLL_TO_BOTTOM : ScrollTypes.SCROLL_TO_TOP;
                        previousScrollValue = offset;
                        return scrollType;
                    })(),
                    data: {
                        absolute: pageYOffset,
                        gap: contentHeight - (viewHeight + offset)
                    }
                });
            }
        });
    }
    getObservableScroll(): Observable<ScrollActionModel> {
        return this.observableWindowScroll;
    }

    userTracker(index: number, user: ExtendedUserModel) {
        return user.id;
    }
}
