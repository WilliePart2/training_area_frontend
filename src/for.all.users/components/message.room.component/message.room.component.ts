import {
    Component, OnInit, OnDestroy, AfterViewInit, Inject, ViewChild, ViewContainerRef, ChangeDetectorRef, NgZone,
    ElementRef
} from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { LabelService } from '../../../common/label.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { MessageFetchService } from '../../services/message.fetch.service';
import { Subscription } from 'rxjs/Subscription';
import { take } from 'rxjs/operator/take';
import { throttleTime } from 'rxjs/operator/throttleTime';
import { MessageSyncronizeService } from '../../services/message.syncronize.service';
import { MessageDateService } from '../../services/message.date.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { MessageCommonLabels } from '../../../common/models/message.common.labels';
import { IMessage } from '../../models/message.model';
import { UserBaseModel } from '../../../common/models/user.base.model';

@Component({
    selector: 'app-message-room',
    templateUrl: 'message.room.component.html',
    styleUrls: [
        './message.room.component.css',
        './message.room.component.laptop.css',
        './message.room.component.tablet.css',
        './message.room.component.computer.css'
    ],
    providers: [
        MessageFetchService,
        {provide: 'Document', useValue: window.document},
        {provide: 'Window', useValue: window},
        MessageSyncronizeService,
        MessageDateService
    ],
    animations: [
        trigger('messageField', [
            state('false', style({height: 0})),
            state('true', style({height: '*'})),
            transition('void => *', [
                style({height: 0}),
                animate('500ms', style({height: '*'}))
            ])
        ]),
        trigger('dropingMessage', [
            transition('* => void', [
                style({
                    opacity: 1,
                    height: '*'
                }),
                animate('300ms', style({
                    opacity: 0,
                    height: 0
                }))
            ])
        ])
    ]
})

export class MessageRoomComponent extends ProtectedComponent implements OnInit, OnDestroy, AfterViewInit {
    isInit: boolean;
    messages: IMessage[] = [];
    members: UserBaseModel[] = [];
    roomId: string; /** id has big integer size */
    message: string;
    isMessageWriting: boolean;

    routeSubscription: Subscription;
    fetchMessagesSubscription: Subscription;
    countNewMessages: number;
    unreadedMessages: IMessage[] = [];
    newMessagesSub: Subscription;

    /**
     * for now this property don't using
     */
    headerHoverStorage: boolean[] = [];

    isFormDimmerEnabled: boolean;
    formDimmerMessage: string;

    isSmallMessageDimmerEnabled: boolean;
    smallMessageDimmerMessage: string;

    messageViewHeight: number;

    _commonLabels: MessageCommonLabels;

    @ViewChild('msgViewContainer', {read: ViewContainerRef}) messagesContainer: ViewContainerRef;
    @ViewChild('msgContainer') totalMessageContainer: ElementRef;
    totalMessageContainerHeight: number;
    @ViewChild('messageTextarea') messageTextarea: ElementRef;
    textareaFocusSub: Subscription;
    textareaKeydownSub: Subscription;
    textareaBlurSub: Subscription;

    windowResizeSubscribe: Subscription;

    messageContainerScrollSub: Subscription;
    isScrollInStartPosition: boolean;
    areUserScrollPage: boolean;
    loadingNewMessages: boolean;

    /** asjusting params */
    frequencyLoadMessages: number; /** specifying in miliseconds */
    minimalOffsetToLoad: number; /** minimal offset which need achieve to load more messages */

    constructor(
        private labelService: LabelService,
        private fetchService: MessageFetchService,
        private route: ActivatedRoute,
        @Inject('Document') public _document,
        private cdr: ChangeDetectorRef,
        private zone: NgZone,
        @Inject('Window') private _window,
        private syncService: MessageSyncronizeService,
        protected userManager: UserManagerService
    ) {
        super(userManager);
        this.sendMessage = this.sendMessage.bind(this);
    }
    ngOnInit() {
        /** params which will be adjusted */
        this.minimalOffsetToLoad = 50; /** 50px */
        this.frequencyLoadMessages = 1000 * 60 * 5; /** 5 minutes */

        this.totalMessageContainerHeight = this._document.documentElement.clientHeight - 50;

        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.MESSAGE_COMMON_LABELS];

        this.enableDimmer();
        this.fetchMessagesSubscription = Observable.timer(0, this.frequencyLoadMessages)
            .flatMap(() => this.getRoomId())
            .flatMap(() => this.getMessages(0, this.isInit))
            .subscribe(() => {
                // const _elt = this.messagesContainer.element.nativeElement;
                this.isInit = true;
                this.headerHoverStorage = this.members ? this.resetHoverStorage(this.members.length) : [];
                this.calculateMessageViewHeight();
                if (!this.areUserScrollPage) {
                    this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(() => {
                        if (this.messagesContainer && this.messages.length) {
                            const elt = this.messagesContainer.element.nativeElement;
                            this.setScrollToDown(elt);
                        }
                    });
                }
                this.disableDimmer();
                this.cdr.detectChanges();
            }, err => {
                this.isInit = true;
                this.disableDimmer();
            });

        this.newMessagesSub = this.syncService.init().subscribe((readedMessages: IMessage[]) => {
            this.checkReadMessage(readedMessages);
        });
    }
    ngAfterViewInit() {
        if (this._document) { this._document.body.style.overflow = 'hidden'; }
        if (this._window && this.messagesContainer) {
            this.windowResizeSubscribe = Observable.fromEvent(this._window, 'resize').subscribe(() => {
                this.totalMessageContainerHeight = this._document.documentElement.clientHeight - 50;
                this.calculateMessageViewHeight();
                this.setScrollToDown(this.messagesContainer.element.nativeElement);
            });
        }
        /** loading older message when user ritch end of message list */
        if (this.messagesContainer) {
            const elt = this.messagesContainer.element.nativeElement;
            this.messageContainerScrollSub = Observable.fromEvent(elt, 'scroll').subscribe((event: Event) => {
                if (this.loadingNewMessages) { return; }
                const viewElt = event.target as HTMLElement;
                const viewHeight = viewElt.clientHeight;
                const viewOffset = viewElt.scrollTop;
                const totalHeight = viewElt.scrollHeight;
                if ((viewHeight + viewOffset) < totalHeight) {
                    this.areUserScrollPage = true;
                } else {
                    this.areUserScrollPage = false;
                }
                if (totalHeight > viewHeight) {
                    if (viewOffset <= this.minimalOffsetToLoad) {
                        this.loadingNewMessages = true;
                        this.emableSmallMessgaeDimmer();
                        this.getMessages(this.getMinimalMessageId()).subscribe(() => {
                            // this.disableSmallMessageDimmer();
                            setTimeout(() => this.loadingNewMessages = false, 200);
                        }, err =>  setTimeout(() => this.loadingNewMessages = false, 200));
                    }
                }
            });
        }
    }
    ngOnDestroy() {
        this.routeSubscription.unsubscribe();
        this.fetchMessagesSubscription.unsubscribe();
        if (this._document) { this._document.body.style.overflow = 'auto'; }
        if (this.windowResizeSubscribe) { this.windowResizeSubscribe.unsubscribe(); }
        if (this.textareaFocusSub) { this.textareaFocusSub.unsubscribe(); }
        if (this.textareaBlurSub) { this.textareaBlurSub.unsubscribe(); }
        if (this.textareaKeydownSub) { this.textareaKeydownSub.unsubscribe(); }
        if (this.messageContainerScrollSub) { this.messageContainerScrollSub.unsubscribe(); }
        if (this.newMessagesSub) { this.newMessagesSub.unsubscribe(); }
    }
    getRoomId() {
        return Observable.create(observer => {
            this.routeSubscription = this.route.queryParams.subscribe(params => {
                if (params && params.roomId) {
                    this.roomId = params.roomId;
                }
                observer.next();
            });
        });
    }
    getMessages(loadOld?: number,  checkNewMessages?: boolean) {
        return Observable.create(observer => {
            this.fetchService.getMessages(this.roomId, !!checkNewMessages, loadOld).subscribe(response => {
                this.checkResponse(response, resp => {
                    const data = resp['data'];

                    this.saveMessages(data['messages'], !!loadOld, checkNewMessages);
                    this.members = this.members && this.members.length ? this.members : data['members'];
                    observer.next();
                });
            }, error => {
                // in this place we will send error message to user
                observer.error();
            });
        });
    }
    saveMessages(messages: IMessage[], toTheEnd: boolean, checkNew?: boolean) {
        if (!messages) { return; }
        const preparedData = messages.reduce((store, msgItem) => {
            const isExists = !!this.messages.find(item => item.messageId === msgItem.messageId);
            if (!isExists) {
                store.push({
                    ...msgItem,
                    isConsidered: !!msgItem.isConsidered
                });
            }
            return store;
        }, []);
        if (!preparedData.length) { return; }
        if (checkNew) { this.addUnreadedMessages(preparedData); }
        this.countNewMessages = this.unreadedMessages && this.unreadedMessages.length;
        if (!toTheEnd) {
            this.messages = this.messages && this.messages.length ? [...this.messages, ...preparedData] : [...preparedData];
            return;
        }
        this.messages = this.messages && this.messages.length ? [...preparedData, ...this.messages] : [...preparedData];
    }
    getMinimalMessageId() {
        let value = 2000000000; /** may be problem in this place */
        this.messages.forEach(item => {
            if (+item.messageId < value) {
                value = +item.messageId;
            }
        });
        return value;
    }
    toggleMessageWriting() {
        /** perform unsubscribe from texarea event if user doesn't write any message */
        if (this.isMessageWriting) {
            if (this.textareaFocusSub) { this.textareaFocusSub.unsubscribe(); }
            if (this.textareaBlurSub) { this.textareaBlurSub.unsubscribe(); }
            if (this.textareaKeydownSub) { this.textareaFocusSub.unsubscribe(); }
        }
        this.isMessageWriting = !this.isMessageWriting;
        this.calculateMessageViewHeight();
        this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(() => {
            if (this.messagesContainer) {
                this.setScrollToDown(this.messagesContainer.element.nativeElement);
            }
            /** enabling handing enter key */
            if (this.isMessageWriting) {
                const elt = this.messageTextarea.nativeElement;
                if (elt) {
                    this.textareaFocusSub = Observable.fromEvent(elt, 'focus').subscribe((evt: Event) => {
                        this.textareaKeydownSub = Observable.fromEvent(evt.target || elt, 'keydown')
                            .subscribe((event: KeyboardEvent) => {
                                if (event.keyCode === 13 && (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey)) {
                                    this.sendMessage();
                                }
                            });
                    });
                    this.textareaBlurSub = Observable.fromEvent(elt, 'blur').subscribe((evt) => {
                        if (this.textareaKeydownSub) { this.textareaKeydownSub.unsubscribe(); }
                    });
                }
            }
        });
    }
    sendMessage() {
        if (!this.message || !this.message.trim()) { return; }
        const messageObj: IMessage = {
            senderId: this.userManager.id,
            message: this.message
        };
        this.enableFormDimmer();
        this.sendMessageToServer(messageObj).subscribe(() => {
            this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(() => {
                if (this.messagesContainer) {
                    this.calculateMessageViewHeight();
                    this.setScrollToDown(this.messagesContainer.element.nativeElement);
                }
            });
            this.disableFormDimmer();
        }, () => {
            this.disableFormDimmer();
        });
    }
    sendMessageToServer(messageObj) {
        return Observable.create(observer => {
            this.fetchService.sendMessage(messageObj, this.roomId).subscribe(response => {
                this.checkResponse(response, resp => {
                    const date = resp['data'];
                    this.message = '';
                    messageObj.messageDate = date.messageDate;
                    messageObj.messageId = date.messageId;
                    this.messages.push(messageObj);
                    observer.next();
                    observer.complete();
                });
            }, error => {
                observer.error();
            });
        });
    }
    addUnreadedMessages(messages: IMessage[]) {
        this.unreadedMessages = this.unreadedMessages && this.unreadedMessages.length ? [...this.unreadedMessages, ...messages] : [...messages];
    }
    /**
     * Percorm calculate height for message list
     * 170 - send form height when does it open
     * 55 - header menu height
     * 30 - form button height which disposed bottom
     */
    calculateMessageViewHeight() {
        let negativeSize = 170 + 55 + 30;
        negativeSize = 200 + 50 + 30 + 20 + 2;
        if (!this.isMessageWriting) {
            negativeSize = 50 + 50 + 2;
        }
        const windowHeight = this._document.documentElement.clientHeight || this._document.body.clientHeight;
        this.messageViewHeight = windowHeight - negativeSize;
    }
    /** perform animation for scrolling message list to down */
    setScrollToDown(elt: HTMLElement) {
        const contentHeight = elt.scrollHeight;
        const viewHeight = this.messageViewHeight;
        if (contentHeight <= viewHeight) { return; }
        const needScroll = contentHeight - viewHeight;
        const duration = 500;
        const frequency = 60;
        const stepSize = (needScroll / (frequency * (duration / 1000)));
        let previousScrollPosition = 0;
        const scheduler = setInterval(() => {
            elt.scrollTop += stepSize;
            if (elt.scrollTop >= needScroll || elt.scrollTop === previousScrollPosition) {
                clearInterval(scheduler);
                this.isScrollInStartPosition = true;
                return;
            }
            previousScrollPosition = elt.scrollTop;
        }, 1000 / frequency);
        elt.scrollTop += contentHeight - viewHeight;
    }
    /** Execute checking does user already read unreaded message */
    checkReadMessage(data: IMessage[]) {
        if (!data || !data.length) { return; }
        this.unreadedMessages = data.reduce((store, rMsg) => {
            return store.filter(urMsg => urMsg.messageId !== rMsg.messageId);
        }, this.unreadedMessages);
        this.countNewMessages = this.unreadedMessages.length;
    }
    /** for now this ,ethod dont using */
    resetHoverStorage(length: number): boolean[] {
        const result = [];
        for (let _i = 0; _i < length; _i++) { result[_i] = false; }
        return result;
    }
    dropMessage(message: IMessage) {
        this.messages = this.messages.filter(messageItem => messageItem.messageId !== message.messageId);
    }
    /** for now this method don't using */
    headerHoverHandler(index: number, flag: boolean) {
        this.headerHoverStorage = this.resetHoverStorage(this.members.length);
        this.headerHoverStorage[index] = flag;
    }
    enableFormDimmer(msg?: string) {
        this.isFormDimmerEnabled = true;
        this.formDimmerMessage = msg || '';
    }
    disableFormDimmer() {
        this.isFormDimmerEnabled = false;
        this.formDimmerMessage = '';
    }
    emableSmallMessgaeDimmer(msg?: string) {
        this.isSmallMessageDimmerEnabled = true;
        this.smallMessageDimmerMessage = msg;
    }
    disableSmallMessageDimmer() {
        this.isSmallMessageDimmerEnabled = false;
        this.smallMessageDimmerMessage = '';
    }
}
