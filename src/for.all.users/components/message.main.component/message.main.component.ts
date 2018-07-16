import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { trigger, transition, animate, style } from '@angular/animations';
import { Observable } from 'rxjs/Observable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { LabelService } from '../../../common/label.service';
import { MessageFetchService } from '../../services/message.fetch.service';
import { SuiModalService, ModalTemplate, TemplateModalConfig } from 'ng2-semantic-ui';
import { PadawanService } from '../../../mentor/services/padawan.service';
import { UserService } from '../../services/user.service';
import { TotalMessageService } from '../../services/total.message.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { MessagePopupLabels } from '../../../common/models/message.popup.labels';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { UserBaseModel } from '../../../common/models/user.base.model';
import { MessageCommonLabels } from '../../../common/models/message.common.labels';
import { MessageCommonIcons } from '../../../common/models/message.common.icons';
import { CommonLabels } from '../../../common/models/common.labels';
import { IMessageRoomBasic } from '../../models/message.room.model';
import { MessageActionLabels } from '../../../common/models/message.action.labels';

interface UserItem {
    id: number;
    username: string;
}

@Component({
    selector: 'app-message-main',
    templateUrl: 'message.main.component.html',
    styleUrls: ['./message.main.component.css'],
    providers: [
        MessageFetchService,
        PadawanService,
        UserService,
        {provide: 'Document', useValue: document},
        {provide: 'Window', useValue: window}
    ],
    animations: [
        trigger('dropRoomItem', [
            transition(':leave', [
                style({
                    height: '*',
                    opacity: 1
                }),
                animate('5000ms', style({
                    height: 0,
                    opacity: 0
                }))
            ])
        ])
    ]
})

export class MessageMainComponent extends ProtectedComponent implements OnInit, OnDestroy {
    addressee: IMessageRoomBasic [];
    filteredAddressee: IMessageRoomBasic[];
    relatedUsers: UserItem[]; /** this think doesn't need here */

    searchAddressee: string;
    searchDelay = 200; /** miliseconds at the end of witch we will start seraching */
    searchPerforming: boolean;
    timerForSearch: any;

    addMessageHeader: string;
    addMessageContent: string;

    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;
    _commonLabels: MessageCommonLabels;
    _commonIcons: MessageCommonIcons;
    _globalCommonLabels: CommonLabels;
    _actionLabels: MessageActionLabels;

    previousSearchValue: string;
    storeReceivedUsers: {key: UserItem[]};
    selectedRecipientIds: number[];
    selectedUsers: UserItem[];
    minimalSearchValue: {key: number};

    clientWidth: number;

    @ViewChild('createMessageModal') sendMessageTemplate: ModalTemplate<any, any, any>;
    smallDimmerEnabled: boolean;
    smallDimmerMessage: string;
    smalDimmerClickable: boolean;

    constructor(
        private labelService: LabelService,
        private fetchService: MessageFetchService,
        private modalService: SuiModalService,
        private messageService: TotalMessageService,
        private padawanService: PadawanService,
        private userService: UserService,
        @Inject('Document') private _document,
        @Inject('Window') private _window,
        protected userManager: UserManagerService
    ) {
        super(userManager);
        // this.findAddresseeHandler = this.findAddresseeHandler.bind(this);
        this.getClientWidth = this.getClientWidth.bind(this);
    }
    optionLookupFunc = (query: string, initial?: UserBaseModel) => {
        const regExp = new RegExp('(^|\s?)' + query + '(\s?|$)', 'iu');
        /**
         * first char is the key for data storage
        */
        const key = query.substring(0, 1);

        if (!query) {
            return new Promise((resolve, reject) => {
                resolve([]);
            });
        }

        if (this.previousSearchValue && this.storeReceivedUsers[key]) {
            const previousFirstLetter = this.previousSearchValue.substring(0, 1);
            if (previousFirstLetter.toLowerCase() === key.toLowerCase()) {
                const filteredItems = this.storeReceivedUsers[key].filter(user => user.username.search(regExp) === -1 ? false : true);
                this.minimalSearchValue[key] = this.calculateMinimalSearchValue(this.storeReceivedUsers[key].length);
                if (filteredItems && filteredItems.length > this.minimalSearchValue[key] || 0) {
                    return new Promise((resolve, reject) => {
                        resolve(filteredItems);
                    });
                }
            }
        }

        this.previousSearchValue = query;
        return new Promise((resolve, reject) => {
            this.userService.findUserByPartOfUsername(query).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.addReceivedUsersToStore(key, resp['data']);
                    this.minimalSearchValue[key] = this.calculateMinimalSearchValue(this.storeReceivedUsers[key].length);
                    const filteredItems = this.storeReceivedUsers[key].filter(user => user.username.search(regExp) === -1 ? false : true);
                    resolve(filteredItems);
                });
                if (!response || !response.result) {
                    this.previousSearchValue = '';
                    reject();
                }
            }, error => {
                this.previousSearchValue = '';
                reject();
            });
        });
    }
    addReceivedUsersToStore(key: string, data: UserItem[]) {
        if (this.storeReceivedUsers[key] && this.storeReceivedUsers[key].length) {
            this.storeReceivedUsers[key] = [
                ...this.storeReceivedUsers[key].filter(item => !data.find(dataItem => +dataItem.id === +item.id)),
                ...data
            ];
            return;
        }
        this.storeReceivedUsers[key] = data;
    }
    calculateMinimalSearchValue(length: number) {
        let minimalLimit = 0;
        if (length > 100) { minimalLimit = length / 10; }
        if (minimalLimit > 100) { minimalLimit = 100; }
        return minimalLimit;
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._commonLabels = labels[LABEL_GROUP_NAMES.MESSAGE_COMMON_LABELS];
        this._commonIcons = labels[LABEL_GROUP_NAMES.MESSAGE_COMMON_ICONS];
        this._globalCommonLabels = labels[LABEL_GROUP_NAMES.COMMON_LABELS];
        this._actionLabels = labels[LABEL_GROUP_NAMES.MESSAGE_ACTION_LABELS];


        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.getUserAddressees().subscribe(() => {
            this.disableDimmer();
        }, error => {
            this.errorMessage(this._errorLabels.LOAD_MESSAGES_ERROR);
        });

        this.clientWidth = this._document.documentElement.clientWidth;
        this._window.addEventListener('resize', this.getClientWidth, false);

        this.minimalSearchValue = {} as {key: number};
        this.storeReceivedUsers = {} as {key: UserItem[]};
    }

    ngOnDestroy() {
        this._window.removeEventListener('resize', this.getClientWidth);
    }
    getUserAddressees() {
        return Observable.create(observer =>  {
            this.fetchService.getAddressees(this.userManager.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.addressee = resp['data'];
                    this.filteredAddressee = [...this.addressee];
                    observer.next();
                });
            }, error => {
                observer.error();
            });
        });
    }
    findAddresseeHandler() {
        if (this.searchPerforming) { return; }
        if (this.timerForSearch) {
            clearTimeout(this.timerForSearch);
        }
        this.timerForSearch = setTimeout(() => {
            if (!this.addressee || !this.addressee.length) { return; }
            this.searchPerforming = true;
            this.filteredAddressee = this.filterAddressee(this.addressee, this.searchAddressee.trim());
            this.searchPerforming = false;
        }, this.searchDelay);
    }
    openSendMessageWindow() {
        const config = new TemplateModalConfig(this.sendMessageTemplate);

        this.modalService.open(config)
            .onApprove(() => {
                this.clearTmpMessageData();
            })
            .onDeny(() => {
                this.clearTmpMessageData();
            });
    }
    wrapperForSending(callback: Function) {
        if (!this.addMessageContent || !this.addMessageHeader || !this.selectedRecipientIds || !this.selectedRecipientIds.length) {
            return;
        }
        this.enableSmallDimmer(this._dimmerLabels.USER_MESSAGE_SENDING);
        this.fetchService.creaateUserChatRoom(this.selectedRecipientIds, this.addMessageContent, this.addMessageHeader.trim()).subscribe(response => {
            this.checkResponse(response, resp => {
                this.addressee.push({
                    roomId: resp['data']['roomId'],
                    roomOwner: this.userManager.id,
                    roomTopic: this.addMessageHeader.trim(),
                    countMessages: 1,
                    newMessages: 0,
                    members: resp['data']['members']
                });
                this.filteredAddressee = this.filterAddressee(this.addressee, this.searchAddressee);
                callback();
                this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_MSG_SEND);
            });
            if (!response || !response.result) {
                this.messageService.sendErrorMessage(this._actionLabels.ERROR_MSG_SEND);
            }
            this.disableSmallDimmer();
        }, error => {
            this.messageService.sendErrorMessage(this._actionLabels.ERROR_MSG_SEND);
            this.disableSmallDimmer();
        });
    }
    dropAddresse(item: IMessageRoomBasic) {
        this.addressee = this.addressee.filter(roomItem => roomItem.roomId !== item.roomId);
        this.filteredAddressee = this.filterAddressee(this.addressee, this.searchAddressee);
    }
    /** ??? */
    selectUserForSedMessage(data: any) {
        // console.log(data);
    }
    filterAddressee(store: IMessageRoomBasic[], query?: string) {
        const regExp = new RegExp('(^| \s+)' + query + '(\s*|$)', 'si');
        if (!query) { return store; }
        return store.filter(storeItem => !!storeItem.members.find(memeberItem => memeberItem.username.search(regExp) !== -1));
    }
    clearTmpMessageData() {
        this.selectedRecipientIds = null;
        this.storeReceivedUsers = null;
        this.previousSearchValue = null;
        this.addMessageHeader = null;
        this.addMessageContent = null;
    }
    getClientWidth() {
        this.clientWidth = this._document.documentElement.clientWidth;
    }
    enableSmallDimmer(msg?: string, clickable?: boolean) {
        this.smallDimmerMessage = msg ? msg : '';
        this.smalDimmerClickable = !!clickable;
        this.smallDimmerEnabled = true;
    }
    disableSmallDimmer() {
        this.smallDimmerEnabled = false;
        this.smallDimmerMessage = '';
        this.smalDimmerClickable = false;
    }
    topicItemTrack(index: number, item: IMessageRoomBasic) {
        return item.roomId;
    }
}
