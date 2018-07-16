import { Component,
    ViewChild,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ElementRef,
    ViewContainerRef,
    Inject,
    trigger,
    state,
    style,
    transition,
    animate,
    TemplateRef,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    ApplicationRef
} from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { AuthorizationService } from '../../../index/services/authorization.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { LogService } from '../../../common/log.service';
import { TotalMessageService } from '../../../for.all.users/services/total.message.service';
import { LabelService } from '../../../common/label.service';

import * as actions from '../../../for.all.users/actions/total.message.actions';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { MenuLabelsModel } from '../../../common/models/menu.labels.model';

@Component({
    selector: 'app-main-wrap',
    templateUrl: './main.wrap.component.html',
    styleUrls: ['./main.wrap.component.css'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: 'Window', useValue: window},
        TotalMessageService,
        Location
    ],
    animations: [
        trigger('sidebarVisibleChange', [
            state('true', style({
                marginLeft: 0,
            })),
            state('false', style({
                marginLeft: '-55%'
            })),
            transition('true <=> false', animate('300ms'))
        ]),
        trigger('messageAnimation', [
            transition('void => *', [
                style({opacity: 0}),
                animate('300ms', style({opacity: 1}))
            ]),
            transition('* => void', [
                style({opacity: 1}),
                animate('300ms', style({opacity: 0}))
            ])
        ])
    ]
})

export class MainWrapComponent extends ProtectedComponent implements OnInit, OnDestroy {
    username: string;
    type: 'mentor' | 'user';

    avatar: string;
    avatarSubscription: Subscription;

    pageHeight: number;
    isMobile: boolean;
    @ViewChild('sidebar') sidebarContainer: ElementRef;
    sidebarVisible: boolean;
    sidebarWidth: number;

    messageSubscrition: Subscription;
    messageConfig: {[k: string]: {[k: string]: string} | number | string};
    visibleMessages: number;
    messageStyle: {[k: string]: string};
    @ViewChild('message') messageTemplate: TemplateRef<any>;
    @ViewChild('messageContainer', {read: ViewContainerRef}) messageContainer: ViewContainerRef;
    messageContainerStyle: {[k: string]: string};

    _errorLabels: ErrorLabelsModel;
    _menuLabels: MenuLabelsModel;

    constructor(
        private authManager: AuthorizationService,
        protected userManager: UserManagerService,
        @Inject('Window') private window,
        private loger: LogService,
        private viewContainer: ViewContainerRef,
        private totalMessage: TotalMessageService,
        private cdr: ChangeDetectorRef,
        private applicationRef: ApplicationRef,
        private _location: Location,
        private labelService: LabelService
    ) {
        super(userManager);
    }
    ngOnInit() {
        this.username = this.userManager.username;
        this.type = this.userManager.type;

        /** subscribe to emmiting messages */
        this.messageContainerStyle = this.totalMessage.getMessageContainerConfig().style;
        this.messageConfig = this.totalMessage.getMessageConfig();
        this.messageStyle = <{[k: string]: string}>this.messageConfig.style;
        this.messageSubscrition = this.totalMessage.getCore().subscribe((action) => {
            switch (action.type) {
                case actions.MESSAGE: this.showMessage(action['data'], ''); break;
                case actions.SUCCESS_MESSAGE: this.showMessage(action['data'], 'success'); break;
                case actions.ERROR_MESSAGE: this.showMessage(action['data'], 'error'); break;
            }
        });

        const labels = this.labelService.getLabels();
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._menuLabels = labels[LABEL_GROUP_NAMES.MENU_LABELS];
    }
    ngOnDestroy() {
        this.messageSubscrition.unsubscribe();
    }
    onLogout() {
        this.authManager.logoutUser(this.userManager.accessToken).subscribe(response => {
            if (!response) { return; }
            this.showMessage(this._errorLabels.USER_LOGOUT_ERROR, 'error');
            this.userManager.resetAccessToken();
            this.userManager.redirectUser('');
        });
    }
    log(message: any, category = '') {
        this.loger.log(message, category);
    }
    showMessage(msg: string, type: '' | 'error' | 'success' | 'info', duration?: number) {
            const emebededViewRef = this.messageContainer.createEmbeddedView(this.messageTemplate, {
                $implicit: {
                    message: msg,
                    class: type
                }
            });
            this.visibleMessages = this.visibleMessages + 1;
            setTimeout(() => {
                emebededViewRef.destroy();
                this.visibleMessages = this.visibleMessages - 1;
            }, duration || this.messageConfig.duration);
            this.cdr.detectChanges();
    }
    goBack() {
        this._location.back();
    }
    goForward() {
        this._location.forward();
    }
}
