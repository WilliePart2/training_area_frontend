import { Component, Input, Output, ViewChild, ViewContainerRef, Inject, AfterViewInit, OnDestroy, EventEmitter } from '@angular/core';
import { UserManagerService } from '../../../common/user.manager.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { PostService } from '../../services/post.service';

import { DisplayedArticlePostModel, DisplayedListPostModel, DisplayedVideoPostModel } from '../../models/posts.models';

import { addEventHandler, removeEventHandler } from '../../helpers/manageEventHandler';

abstract class Window { }

@Component({
    selector: 'app-post-view-base',
    template: '',
    providers: [
        // { provide: Window, useValue: window }
    ]
})
export class UserPagePostViewBaseComponent extends ProtectedComponent implements AfterViewInit, OnDestroy {
    @Input() post: DisplayedArticlePostModel | DisplayedListPostModel | DisplayedVideoPostModel;
    @Input() timingFreaze: boolean;
    @Output() setPocessingTiming = new EventEmitter();

    likeBtnThinking: boolean;
    dislikeBtnThinking: boolean;

    isPostViewed: boolean;
    isPostTemporaryViewed: boolean; /** flag restriced miltiple request sending */
    procesesing: boolean;
    @ViewChild('container', { read: ViewContainerRef }) postContainer: ViewContainerRef;
    constructor(
        protected userManager: UserManagerService,
        protected postService: PostService,
        @Inject('Window') protected _window
    ) {
        super(userManager);
        this.checkPostVisible = this.checkPostVisible.bind(this);
    }
    ngAfterViewInit() {
        if (this.postContainer) {
            this._window.addEventListener('scroll', this.checkPostVisible);
        }
    }
    ngOnDestroy() {
        this._window.removeEventListener('scroll', this.checkPostVisible);
    }
    checkPostVisible() {
        if (this.timingFreaze || this.procesesing) { return; }
        this.setPocessingTiming.emit();
        const windowHeight = document.documentElement.clientHeight;
        const scroll = window.pageYOffset || document.documentElement.scrollTop;
        const eltRect = this.postContainer.element.nativeElement.getBoundingClientRect();
        if (eltRect.bottom < (windowHeight + scroll)) {
            this.procesesing = true;
            this.postService.incrementViewCounter(this.post.postId).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.post.views = +this.post.views + 1;
                    this.isPostTemporaryViewed = true;
                    this._window.removeEventListener('scroll', this.checkPostVisible);
                });
            }, error => { });
        }
    }
    setLike() {
        this.likeBtnThinking = true;
        this.postService.setLike(this.post.postId, this.userManager.id).subscribe(response => {
            this.checkResponse(response, resp => {
                switch (resp['data']) {
                    case 'ADD': this.post.likes = +this.post.likes + 1; break;
                    case 'REMOVE': this.post.likes = +this.post.likes - 1; break;
                }
                this.likeBtnThinking = false;
            });
        }, error => {
            this.likeBtnThinking = false;
        });
    }
    setDislike() {
        this.dislikeBtnThinking = true;
        this.postService.setDislike(this.post.postId, this.userManager.id).subscribe(response => {
            this.checkResponse(response, resp => {
                switch (resp['data']) {
                    case 'ADD': this.post.dislikes = +this.post.dislikes + 1; break;
                    case 'REMOVE': this.post.dislikes = +this.post.dislikes - 1; break;
                }
                this.dislikeBtnThinking = false;
            });
        }, error => {
            this.dislikeBtnThinking = false;
        });
    }
}
