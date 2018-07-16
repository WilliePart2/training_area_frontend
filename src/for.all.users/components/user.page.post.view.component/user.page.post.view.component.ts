import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    Input,
    ViewChild,
    TemplateRef,
    ElementRef,
    ChangeDetectorRef,
    ViewContainerRef,
    Inject
} from '@angular/core';
import { UserPagePostViewBaseComponent } from '../user.page.post.view.base.component/user.page.post.view.base.component';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { PostService } from '../../services/post.service';
import { PostRelationService } from '../../services/post.relation.service';
import { Observable } from 'rxjs/Observable';

import {
    DisplayedArticlePostModel,
    DisplayedVideoPostModel,
    DisplayedListPostModel,
    BaseDisplayedPostModel,
    BasePostModel,
    AlteredListModel,
    NewListItemsData
} from '../../models/posts.models';
import { ListItem } from '../../models/list.item';
import * as postTypes from '../../models/post.types';
import { DomSanitizer } from '@angular/platform-browser';
import { TotalMessageService } from '../../services/total.message.service';
import { ViewPostService } from '../../services/view.post.service';
import { HoverService } from '../../services/hover.service';
import { LabelService } from '../../../common/label.service';

import { addEventHandler, removeEventHandler } from '../../helpers/manageEventHandler';

import * as _lgn from '../../../common/models/label.group.names';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { PostViewActionLabels } from '../../../common/models/post.view.action.label.model';
import { PostViewCommonIcons } from '../../../common/models/post.view.common.icons.model';
import { PostViewPopupLabels } from '../../../common/models/post.view.popup.labels.model';
import { PostViewCommonLabels } from '../../../common/models/post.view.common.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';


@Component({
    selector: 'app-user-page-post-view',
    templateUrl: 'user.page.post.view.component.html',
    styleUrls: ['./user.page.post.view.component.css'],
    providers: [ViewPostService]
})

export class UserPagePostViewComponent extends UserPagePostViewBaseComponent implements OnInit, AfterViewInit, OnDestroy {
    isEditable: boolean;
    @Input() userId: number;
    @Input() selfId: number;
    // @Input() post: DisplayedArticlePostModel | DisplayedVideoPostModel | DisplayedListPostModel;
    @Input() listItemHover: number;
    itemUnderFocus: boolean;

    previousPost: (DisplayedArticlePostModel | DisplayedVideoPostModel | DisplayedListPostModel) | string;
    addedListItems: ListItem[];
    removedListItems: ListItem[];
    newListItemContent: string;

    types = postTypes;

    videoWidth: number;
    videoHeight: number;
    videoStyle = {
        // position: 'absolute',
        width: '100%',
        height: '100%'
    };
    videoEltCreated: boolean;
    @ViewChild('videoContainer', {read: ViewContainerRef}) videoElt: ViewContainerRef;
    videoIframe: HTMLIFrameElement;

    headerStyle = {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: '1rem',
        paddingRight: '0.25rem',
        lineHeight: '28px'
    };

    resizeEventAttached: boolean;

    _actionLabels: PostViewActionLabels;
    _commonIcons: PostViewCommonIcons;
    _commonLabels: PostViewCommonLabels;
    _popupLabels: PostViewPopupLabels;
    _dimmerLabels: DimmerLabels;
    constructor(
        private viewService: ViewPostService,
        private cdr: ChangeDetectorRef,
        private _sanitizer: DomSanitizer,
        private postRelation: PostRelationService,
        protected postService: PostService,
        private messageService: TotalMessageService,
        @Inject('Window') protected _window,
        private hoverService: HoverService,
        private labelService: LabelService,
        protected userManager: UserManagerService
    ) {
        super(userManager, postService, _window);
        this.wrapperForCreatingVideo = this.wrapperForCreatingVideo.bind(this);
        this.wrapperForResizingVideo = this.wrapperForResizingVideo.bind(this);
    }

    ngOnInit() {
        /** default values */
        this.videoWidth = 640;
        this.videoHeight = 360;
        this.isEditable = false;

        /**
         * Receive labels fot use
         * We receive label group names throught const enum
         */
        const labels = this.labelService.getLabels();
        this._actionLabels = labels[LABEL_GROUP_NAMES.POST_VIEW_ACTIONS_LABELS];
        this._commonIcons = labels[LABEL_GROUP_NAMES.POST_VIEW_COMMON_ICONS];
        this._popupLabels = labels[LABEL_GROUP_NAMES.POST_VIEW_POPUP_LABELS];
        this._commonLabels = labels[LABEL_GROUP_NAMES.POST_VIEW_COMMON_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];

        if (this._window) {
            addEventHandler(this._window, 'resize', this.wrapperForResizingVideo);
            this.resizeEventAttached = true;
        }
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        if (this.resizeEventAttached) {
            removeEventHandler(this._window, 'resize', this.wrapperForResizingVideo);
        }
    }
    ngAfterViewInit() {
        super.ngAfterViewInit();

        this.calculateVideoSize();
        this.createVideoElement(
            this.videoElt ? this.videoElt.element.nativeElement : null,
            this.post['url']
        );
        if (this.post.type === postTypes.VIDEO) {
            this._window.addEventListener('scroll', this.wrapperForCreatingVideo, false);
            this.cdr.detectChanges();
        }
    }
    wrapperForCreatingVideo() {
        if (!this.videoElt) { return; }
        const elt = this.videoElt.element.nativeElement;
        const position = elt.getBoundingClientRect();
        const offset = window.pageYOffset || document.documentElement.scrollTop;
        const viewAreaHeight = document.documentElement.clientHeight || document.body.clientHeight;
        if (position.top < viewAreaHeight) {
            this.calculateVideoSize();
            this.createVideoElement(
                elt,
                this.post['url']
            );
            this._window.removeEventListener('scroll', this.wrapperForCreatingVideo);
        }
    }
    wrapperForResizingVideo() {
        if (!this.videoIframe) { return; }
        this.calculateVideoSize();
        this.videoIframe.setAttribute('width', `${this.videoWidth}`);
        this.videoIframe.setAttribute('height', `${this.videoHeight}`);
        for (const prop in this.videoStyle) {
            if (!this.videoStyle.hasOwnProperty(prop)) { continue; }
            if (typeof this.videoStyle[prop] === 'function') { continue; }
            this.videoIframe.style[prop] = this.videoStyle[prop];
        }
    }
    calculateVideoSize() {
        if (this.post.type === postTypes.VIDEO &&  this.videoElt && this.videoElt.element.nativeElement) {
            const elt = this.videoElt.element.nativeElement;
            this.videoWidth = elt.clientWidth;
            this.videoHeight = (this.videoWidth / 16) * 9;
            this.videoStyle.width = `${this.videoWidth}px`;
            this.videoStyle.height = `${this.videoHeight}px`;
        }
    }
    createVideoElement(container: HTMLElement, videoId: string) {
        if (!container || !videoId) { return; }
        if (this.post.type !== postTypes.VIDEO) { return; }
        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = ''; // load youtube api librari

        const iframe = document.createElement('iframe');
        for (const prop in this.videoStyle) {
            if (!this.videoStyle.hasOwnProperty(prop)) { continue; }
            if (typeof this.videoStyle[prop] === 'function') { continue; }
            iframe.style[prop] = this.videoStyle[prop];
        }
        iframe.src = 'https://www.youtube.com/embed/' + videoId;
        iframe.setAttribute('width', `${this.videoWidth}px`);
        iframe.setAttribute('height', `${this.videoHeight}`);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', '1');
        container.appendChild(iframe);
        this.videoIframe = iframe;
    }
    changeVideoId() {
        if (this.post.type !== postTypes.VIDEO) { return; }
        if (JSON.parse(this.previousPost as string)['url'] === this.post['url']) { return; }
        if ((<string>this.post['url']).search(/^[\-_=0-9a-zA-Z]+$/) === -1) { return; }

        this.calculateVideoSize();
        this.createVideoElement(this.videoElt ? this.videoElt.element.nativeElement : null, this.post['url'] as string);
    }
    listItemTracker(index: number, item: ListItem) {
        return item.id;
    }
    removeListItem(removingItem: ListItem) {
        if (!Array.isArray(this.post.content)) { return; }
        // deleted items mus be added in deleting array and then send on server
        let isTmp = false;
        if (this.addedListItems && this.addedListItems.length) {
            this.addedListItems = this.addedListItems.filter(item => +item.id !== +removingItem.id ? true : (isTmp = true));
        }
        if (!isTmp) {
            this.removedListItems = this.removedListItems ? [
                ...this.removedListItems,
                this.post.content.find(item => +item.id === +removingItem.id)
            ] : [this.post.content.find(item => +item.id === + removingItem.id)];
        }
        this.post = {
            ...this.post,
            content: this.post.content.filter(item => +item.id !== +removingItem.id)
        };
    }
    addNewListItem() {
        if (!this.newListItemContent) { return; }
        const newItem = this.viewService.cretaeNewListItems(this.newListItemContent);
        this.addedListItems = this.addedListItems ? [...this.addedListItems, newItem] : [newItem];
        if (Array.isArray(this.post.content) && this.post.content.length) {
            this.post.content = [
                ...this.post.content.filter(item => !this.addedListItems.find(addedItem => +addedItem.id === +item.id)),
                ...this.addedListItems
            ];
        } else {
            this.post.content = [...this.addedListItems];
        }
        this.newListItemContent = '';
    }
    enableEditMode() {
        this.isEditable = true;
        this.previousPost = JSON.stringify({...this.post});
    }
    disableEditMode() {
        switch (this.post.type) {
            case postTypes.ARTICLE: this.saveArticleOnServer().subscribe(() => {
                this.isEditable = false;
                this.postRelation.changePost(this.post);
            }, complete => {
                this.isEditable = false;
                console.log('error handler');
            }, error => {
                this.isEditable = false;
                console.log('complete handler');
            }); break;
            case postTypes.LIST: {
                this.saveListOnServer().subscribe((newIds: NewListItemsData[]) => {
                    this.isEditable = false;
                    this.clearTmpData();
                    this.post.content = this.viewService.swapListItemsIds(this.post.content as ListItem[], newIds);
                    this.postRelation.changePost(this.post);
                }, complete => {
                    this.isEditable = false;
                    this.clearTmpData();
                }, error => {
                    this.isEditable = false;
                    this.clearTmpData();
                });
            } break;
            case postTypes.VOTING_LIST: this.saveVotingListOnServer().subscribe((newIds: NewListItemsData[]) => {
                this.isEditable = false;
                this.clearTmpData();
                this.post.content = this.viewService.swapListItemsIds(this.post.content as ListItem[], newIds);
                this.postRelation.changePost(this.post);
            }, complete => {
                this.isEditable = false;
                this.clearTmpData();
            }, error => {
                this.isEditable = false;
                this.clearTmpData();
            }); break;
            case postTypes.VIDEO: {
                const requestResult = this.saveVideoOnServer();
                this.isEditable = false;
                if (requestResult) {
                    this.saveVideoOnServer().subscribe(() => {
                        this.postRelation.changePost(this.post);
                    });
                }
            } break;
        }
        this.dropHoverFromListItem(null);
    }
    rollBackEditMode() {
        this.clearTmpData();
        this.post = JSON.parse(this.previousPost as string);
        this.isEditable = false;
    }
    saveArticleOnServer() {
        return Observable.create(observer => {
            if (JSON.parse(this.previousPost as string) === this.post) {
                observer.complete();
            }
            this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
            this.postService.savePostEdition(this.post).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_ARTICLE_EDITED);
                    this.disableDimmer();
                    observer.next();
                    observer.complete();
                });
                if (!response || !response.result) {
                    observer.error();
                }
            }, error => {
                this.disableDimmer();
                this.messageService.sendErrorMessage(this._actionLabels.ERROR_ARTICLE_EDITED);
                observer.error();
            });
        });
    }
    saveListOnServer() {
        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        const alteredItems = this.viewService.getAlteredItems(JSON.parse(this.previousPost as string), this.post);
        const finalObj: AlteredListModel = {
            postId: this.post.postId,
            type: this.post.type,
            alteredItems,
            removingItems: this.removedListItems || [],
            newItems: this.addedListItems || []
        };
        return Observable.create(observer => {
            this.postService.saveListEdition(finalObj).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_LIST_EDITED);
                    this.disableDimmer();
                    observer.next(resp['data']['newItems'] as NewListItemsData[]);
                    observer.complete();
                });
            }, error => {
                this.messageService.sendErrorMessage(this._actionLabels.ERROR_LIST_EDITED);
                this.disableDimmer();
                observer.error();
            });
        });
    }
    saveVotingListOnServer() {
        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        const alteredItems = this.viewService.getAlteredItems(JSON.parse(this.previousPost as string), this.post);
        (<ListItem[]>this.post.content).forEach(postItem => +alteredItems.forEach(alteredItem => {
                return +alteredItem.id === +postItem.id && (postItem.vote = false);
            }
        ));
        const finalObj: AlteredListModel = {
            postId: this.post.postId,
            type: this.post.type,
            alteredItems,
            removingItems: this.removedListItems || [],
            newItems: this.addedListItems || []
        };
        return Observable.create(observer => {
            this.postService.saveVotingListEdition(finalObj).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_VOTING_LIST_EDITED);
                    this.disableDimmer();
                    observer.next(resp['data']['newItems']);
                    observer.complete();
                });
            }, error => {
                this.messageService.sendErrorMessage(this._actionLabels.ERROR_VOTING_LIST_EDITED);
                this.disableDimmer();
                observer.error();
            });
        });
    }
    saveVideoOnServer() {
        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        const prevPost = JSON.parse(this.previousPost as string);
        if (prevPost.header === this.post.header && prevPost['url'] === this.post['url']) { return false; }
        return Observable.create(observer => {
            this.postService.saveVideoId(this.post).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_VIDEO_EDITED);
                    this.disableDimmer();
                    observer.next();
                    observer.complete();
                });
            }, error => {
                this.messageService.sendErrorMessage(this._actionLabels.ERROR_VIDEO_EDITED);
                this.disableDimmer();
                observer.error();
            });
        });
    }
    setHoverOnListItem(index: number) {
        if (!this.isEditable) { return; }
        if (this.itemUnderFocus) { this.tearOutFocusFromItem(); }
        this.hoverService.setHover(index);
    }
    dropHoverFromListItem(index: number) {
        if (!this.isEditable) { return; }
        if (this.itemUnderFocus) { return; }
        this.hoverService.removeHover(index);
    }
    holdHoverOnItem() {
        this.itemUnderFocus = true;
    }
    tearOutFocusFromItem() {
        this.itemUnderFocus = false;
    }
    takeVote(item: ListItem) {
        let action: 'set' | 'remove';
        (<ListItem []>this.post.content).forEach(handledItem => {
            if (+handledItem.id === +item.id) {
                if (handledItem.vote) {
                    action = 'remove';
                } else {
                    action = 'set';
                }
                handledItem.vote = !handledItem.vote;
                return;
            }
            handledItem.vote = false;
        });
        const post = {
            ...this.post,
            content: [item]
        };
        if (action === 'set') {
                this.postService.setVoteForListItem(post, action).subscribe(response => {
                    this.checkResponse(response, resp => {
                        this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_LIST_VOTE_MESSAGE);
                    });
                }, error => {
                    this.messageService.sendErrorMessage(this._actionLabels.ERROR_LIST_VOTE_MESSAGE);
                });
        } else {
            this.postService.removeVoteFromListItem(post, action).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_LIST_VOTE_MESSAGE);
                });
            }, error => {
                this.messageService.sendErrorMessage(this._actionLabels.ERROR_LIST_VOTE_MESSAGE);
            });
        }
    }
    removePost() {
        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.postService.removePost(this.post).subscribe(response => {
            this.checkResponse(response, resp => {
                this.postRelation.removePost(this.post);
                this.disableDimmer();
                this.messageService.sendSuccessMessage('Вы успешно удалили пост');
            });
        }, error => {
            this.disableDimmer();
            this.messageService.sendErrorMessage('Ошибка, пост не удалось удалить!');
        });
    }
    clearTmpData() {
        this.addedListItems = [];
        this.newListItemContent = '';
        this.removedListItems = [];
    }
}
