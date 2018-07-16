import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { ListPostModel, VideoPostModel, ArticlePostModel } from '../models/posts.models';
import * as actions from '../actions/post.actions';

@Injectable()
export class PostRelationService {
    $core: Observable<any>;
    _observer: Observer<any>;
    constructor() {
        this.$core = Observable.create(observer => {
            this._observer = observer;
        });
    }
    init() {
        return this.$core;
    }
    addPost(post: ArticlePostModel | ListPostModel | VideoPostModel) {
        this._observer.next({
            type: actions.ADD_POST,
            payload: post
        });
    }
    removePost(post: ArticlePostModel | ListPostModel | VideoPostModel) {
        this._observer.next({
            type: actions.REMOVE_POST,
            payload: post
        });
    }
    changePost(post: ArticlePostModel | ListPostModel | VideoPostModel) {
        this._observer.next({
            type: actions.CHANGE_POST,
            payload: post
        });
    }
}
