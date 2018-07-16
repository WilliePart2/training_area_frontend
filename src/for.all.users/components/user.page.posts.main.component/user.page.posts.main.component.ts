import { Component, OnInit, OnDestroy, Input, Inject, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { PostRelationService } from '../../services/post.relation.service';
import { PostService } from '../../services/post.service';
import { HoverService } from '../../services/hover.service';
import { LabelService } from '../../../common/label.service';

import {
    DisplayedArticlePostModel,
    DisplayedVideoPostModel,
    DisplayedListPostModel,
    BasePostModel,
    BaseDisplayedPostModel
} from '../../models/posts.models';
import * as actions from '../../actions/post.actions';
import * as hoverActions from '../../actions/hover.actions';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';

@Component({
    selector: 'app-user-page-posts',
    templateUrl: 'user.page.posts.main.component.html',
    providers: [
        PostRelationService,
        PostService,
        {provide: 'Window', useValue: window},
        HoverService
    ],
})

export class UserPagePostsMainComponent extends ProtectedComponent implements OnInit, OnDestroy {
    _userId: number;
    _selfId: number;
    @Input() set userId(val: number) { this._userId = parseInt(`${val}`, 10); }
    get userId() { return this._userId; }
    @Input() set selfId(val: number) { this._selfId = parseInt(`${val}`, 10); }
    get selfId() { return this._selfId; }
    @Input() isParentDimmerEnabled: boolean;
    @Output() postsLoaded = new EventEmitter<boolean>(true);

    posts: DisplayedArticlePostModel[] | DisplayedVideoPostModel[] | DisplayedListPostModel[];
    postSubscription: Subscription;

    step = 50;
    minItemIndex = 0;
    countRenderedItems = 10;
    maxItemIndex = this.countRenderedItems + this.minItemIndex;

    hoverSubscription: Subscription;
    listItemHover: number;

    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    timingFreaze: boolean;
    /**
     * When this property is true incrementing of view counter is freaze
    */
    loadMorePostProcessing: boolean;
    itemsFetching: boolean;
    noMorePosts: boolean;
    getMorePostsDelayInterval = 200;
    postWillBeLoadedLater: boolean;
    getMorePostFreazeTime: number; /** timestamp when loading posts will be delayed */
    offsetSnapshot: number;

    constructor(
        private postRelation: PostRelationService,
        private postService: PostService,
        @Inject('Window') private window,
        private hoverService: HoverService,
        private labelService: LabelService,
        private route: ActivatedRoute,
        protected userManager: UserManagerService,
    ) {
        super(userManager);
        this.getMorePostWrapper = this.getMorePostWrapper.bind(this);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        if (!this.dimmed && !this.isParentDimmerEnabled) {
            this.enableDimmer(this._dimmerLabels.LOAD_POST_MSG);
        }
        this.postSubscription = this.postRelation.init().subscribe(action => {
            switch (action.type) {
                case actions.ADD_POST: this.addPost(action.payload); break;
                case actions.REMOVE_POST: this.removePost(action.payload); break;
                case actions.CHANGE_POST: this.changePost(action.payload); break;
            }
        });
        this.hoverSubscription = this.hoverService.init().subscribe((action) => {
            switch (action.type) {
                case hoverActions.ADD_HOVER: this.setHoverOnListItem(action.payload); break;
                case hoverActions.REMOVE_HOVER: this.removeHoverFromListItem(); break;
            }
        });
        this.limit = this.step;
        this.itemsFetching = true;
        this.getPosts().subscribe(() => {
            this.postsLoaded.emit(true);
            this.itemsFetching = false;
        }, error => {
            this.postsLoaded.emit(true);
            this.itemsFetching = false;
        });

        this.route.queryParams.subscribe(queryParams => {
            if (queryParams && queryParams.id) {
                this.userId = +queryParams.id;
                this.posts = null;
                if (this.itemsFetching) { return; }
                this.itemsFetching = true;
                this.getPosts().subscribe(() => {
                    this.postsLoaded.emit(true);
                    this.itemsFetching = false;
                }, error => {
                    this.postsLoaded.emit(true);
                    this.itemsFetching = false;
                });
            }
        });

        if (this.window) {
            this.window.addEventListener('scroll', this.getMorePostWrapper, false);
        }
    }
    ngOnDestroy() {
        if (this.postSubscription) {
            this.postSubscription.unsubscribe();
        }
        if (this.window) {
            this.window.removeEventListener('scroll', this.getMorePostWrapper);
        }
    }
    getPosts() {
        let lastReceivedPost = null;
        if (this.posts && this.posts.length) {
            lastReceivedPost = this.posts[this.posts.length - 1];
        }
        return Observable.create(observer => {
            this.postService.getPosts(this.userId, lastReceivedPost ? lastReceivedPost.postId : 0, this.limit).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.insertPost(resp['data'] as BaseDisplayedPostModel);
                    console.log(this.posts);
                    observer.next();
                    observer.complete();
                });
                if (!response || !response.result) {
                    this.noMorePosts = true;
                    observer.error();
                }
            }, error => {
                this.errorMessage(this._errorLabels.LOAD_POST_ERROR_MSG);
                observer.error();
            });
        });
    }
    mainTracker(index: number, item: BasePostModel) {
        return +item.postId;
    }
    addPost(post: BasePostModel) {
        if (!post) { return; }
        this.insertPost(this.postService.convertPostToDisplayModel(post), true);
    }
    removePost(post: BasePostModel) {
        this.posts = this.postService.removePostFromStorage(this.posts, post);
    }
    changePost(post: BasePostModel) {
        this.posts = this.postService.swapPostInStorage(this.posts, post);
    }
    getMorePostWrapper() {
        if (this.noMorePosts || this.itemsFetching || this.postWillBeLoadedLater) { return; }
        if (this.loadMorePostProcessing) {
            this.postWillBeLoadedLater = true;
            setTimeout(() => {
                this.loadMorePostProcessing = false;
                this.postWillBeLoadedLater = false;
                this.offsetSnapshot = window.pageYOffset || document.documentElement.scrollTop;
                this.getMorePostWrapper();
            }, Date.now() - this.getMorePostFreazeTime);
            return;
        }

        this.loadMorePostProcessing = true;
        this.getMorePostFreazeTime = Date.now();
        setTimeout(() => this.loadMorePostProcessing = false, this.getMorePostsDelayInterval);

        const pageHeight = Math.max(
            document.documentElement.scrollHeight, document.body.scrollHeight,
            document.documentElement.clientHeight, document.body.clientHeight,
            document.documentElement.offsetHeight, document.body.offsetHeight
        );
        const scroll = this.offsetSnapshot || window.pageYOffset || document.documentElement.scrollTop;
        const viewHeight = document.documentElement.clientHeight;
        if ((pageHeight - 100) <= (viewHeight + scroll)) {
            this.itemsFetching = true;
            this.getMoreItems();
        }
    }
    getMoreItems() {
        this.maxItemIndex = this.maxItemIndex + this.countRenderedItems;
        /** if in storage exists not rendered items and wee can display enough items */
        if (this.posts && this.posts.length > this.maxItemIndex && (this.posts.length - this.maxItemIndex) > this.countRenderedItems) {
            this.itemsFetching = false;
        } else {
            /** if in storage don't exists not rendered items */
            this.offset = this.offset + this.step;
            this.enableDimmer(this._dimmerLabels.LOAD_POST_MSG);
            this.getPosts().subscribe(() => {
                this.disableDimmer();
                this.itemsFetching = false;
            }, () => {
                this.disableDimmer();
                this.itemsFetching = false;
            });
        }
    }
    /** helpers */
    insertPost(post: BaseDisplayedPostModel | Array<BaseDisplayedPostModel>, place?: boolean) {
        if (Array.isArray(this.posts) && this.posts.length) {
            if (place) {
                this.posts = Array.isArray(post) ? [...post, ...this.posts] : [post, ...this.posts];
                return;
            }
            this.posts = Array.isArray(post) ? [...this.posts, ...post] : [...this.posts, post];
        } else {
            this.posts = Array.isArray(post) ?  [...post] : [post];
        }
    }
    setHoverOnListItem(listItemsIndex: number) {
        this.listItemHover = listItemsIndex;
    }
    removeHoverFromListItem() {
        this.listItemHover = null;
    }
    processingTimingHandler() {
        this.timingFreaze = true;
        setTimeout(() => this.timingFreaze = false, 1000);
    }
}
