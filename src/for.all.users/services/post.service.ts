import { Injectable } from '@angular/core';
import { UrlService } from '../../common/url.service';
import { UserManagerService } from '../../common/user.manager.service';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../common/base.service';

import { ListItem } from '../models/list.item';
import { NewPostModel, NewPostDataModel, NewPostContentModel, BasePostModel, BaseDisplayedPostModel, AlteredListModel } from '../models/posts.models';
import * as postTypes from '../models/post.types';

@Injectable()
export class PostService extends BaseService {
    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private urlService: UrlService
    ) {
        super(userManager, http);
    }
    /** methods wich perform data manipulation */
    removeListItem(storage: Array<ListItem>, removedElementId: number) {
        /** i am cool =) */
        return storage.reduce((items, item) => {
            if (item.id !== removedElementId) {
                items.push(item);
            }
            return items;
        }, []);
    }
    replaceIdsInPosts(postObj: NewPostModel, newData: NewPostDataModel) {
        const resultObj = {
            id: newData.postId,
            postId: newData.postId,
            header: postObj.header,
            type: postObj.type,
        };
        if (typeof postObj.content === 'string') {
            resultObj['content'] = postObj.content;
        }
        if (Array.isArray(postObj.content)) {
            resultObj['content'] = postObj.content.map(item => {
                const findedItem = newData.content.find(searchItem => {
                    return parseInt(String(searchItem.oldId), 10) === item.id;
                });
                if (findedItem) {
                    item.id = findedItem.newId;
                }
                return item;
            });
        }
        return resultObj;
    }
    convertPostToDisplayModel(post: BasePostModel) {
        return {
            ...post,
            likes: 0,
            dislikes: 0,
            views: 0,
            isUserLiked: false,
            isUserDisliked: false
        };
    }
    countLikesDislikes(data: Array<{postId: number, like?: null | undefined | number, dislike?: null | undefined | number}>, unit: 'like' | 'dislike') {
        let result = 0;
        const handledIds: number [] = [];
        if (data && data.length) {
            data.forEach(item => {
                if (handledIds.indexOf(item.postId) !== -1) { return; }
                if (item[unit] !== null && item[unit] !== undefined) {
                    result++;
                }
            });
        }
        return result;
    }
    createLists(data: Array<{list_content: string, list_id: number | string, order: number | string}>) {
        const handledIds = [];

        const result = data.reduce((store, item) => {
            if (item && item.list_id && handledIds.indexOf(item.list_id) === -1) {
                store.push(
                    new ListItem(
                        +item.list_id,
                        item.list_content,
                        item['votedItemId'] && +item.list_id === +item['votedItemId'] ? true : false
                    )
                );
                handledIds.push(item.list_id);
            }
            return store;
        }, []);

        result.sort((firstItem: ListItem, secondItem: ListItem) => {
            if (+firstItem.id === +secondItem.id) { return 0; }
            return +firstItem.id > +secondItem.id ? 1 : -1;
        });

        return result;
    }
    removePostFromStorage(storage: BaseDisplayedPostModel[], post: BasePostModel): BaseDisplayedPostModel[] {
        if (!storage || !storage.length || !post) { return storage as BaseDisplayedPostModel[]; }
        return storage.reduce((store, nextItem) => {
            if (+nextItem['id'] !== post.id) {
                store.push(nextItem);
            }
            return store;
        },  []);
    }
    swapPostInStorage(storage: BaseDisplayedPostModel[], post: BasePostModel): BaseDisplayedPostModel[] {
        if (!storage || !storage.length || !post) { return storage; }
        return storage.map(item => +item.id === post.id ? post : item) as BaseDisplayedPostModel[];
    }
    /** methods wich perform http requests */
    createPost(postObj: NewPostModel) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/create-user-post`,
                {
                    PostManager: postObj
                },
                {headers}
            );
        });
    }
    getPosts(userID: number, offset: number, limit: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorUserPage()}/get-user-posts?uid=${userID}&offset=${offset}&limit=${limit}`,
                {headers}
            ).map(response => {
                const handledIds: number [] = [];
                if (response['data'] && response['data'].length) {
                    const result = [];
                    response['data'].forEach(dataItem => {
                        if (handledIds.indexOf(dataItem['postId']) !== -1) { return; }
                        const tmpItem = {
                            postId:  +dataItem['postId'],
                            type: dataItem['type'],
                            header: dataItem['header'],
                            views: +dataItem['views'],
                            uniqueViews: dataItem['uniqueViews'] || 0,
                            likes: +dataItem['likes'],
                            dislikes: +dataItem['dislikes'],
                            isUserLiked: dataItem['isCurrentUserLiked'],
                            isUserDisliked: dataItem['isCurrentUserDisliked']
                        };

                        if (dataItem['type'] === postTypes.ARTICLE) {
                            tmpItem['id'] = parseInt(dataItem['article_id'], 10);
                            tmpItem['content'] = dataItem['content'];
                        }

                        if (dataItem['type'] === postTypes.VIDEO) {
                            tmpItem['id'] = parseInt(dataItem['video_id'], 10);
                            tmpItem['url'] = dataItem['content'];
                        }

                        if (dataItem['type'] === postTypes.LIST || dataItem['type'] === postTypes.VOTING_LIST) {
                            tmpItem['id'] = parseInt(dataItem['list_id'], 10);
                            tmpItem['content'] = dataItem['content'];
                        }

                        result.push(tmpItem);
                        handledIds.push(dataItem['postId']);
                    });
                    response['data'] = result;
                }
                return response;
            });
        });
    }
    savePostEdition(post: BaseDisplayedPostModel) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/save-post-edition`,
                {post},
                {headers}
            );
        });
    }
    saveListEdition(post: AlteredListModel) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/save-post-edition`,
                {post},
                {headers}
            );
        });
    }
    saveVotingListEdition(post: AlteredListModel) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/save-post-edition`,
                {post},
                {headers}
            );
        });
    }
    saveVideoId(post: BaseDisplayedPostModel) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/save-post-edition`,
                {
                    post
                },
                {headers}
            );
        });
    }
    removePost(post: BaseDisplayedPostModel) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/remove-user-post`,
                {post},
                {headers}
            );
        });
    }
    setVoteForListItem(post: BaseDisplayedPostModel, flag: 'set' | 'remove') {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/handle-voting-for-user-list-item`,
                {
                    post,
                    flag
                },
                {headers}
            );
        });
    }
    removeVoteFromListItem(post: BaseDisplayedPostModel, flag: 'set' | 'remove') {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/handle-voting-for-user-list-item`,
                {
                    post,
                    flag
                },
                {headers}
            );
        });
    }
    setLike(postId: number, userId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/manage-user-post-like-dislike`,
                {
                    postId,
                    userId,
                    flag: 'LIKE'
                },
                {headers}
            );
        });
    }
    setDislike(postId: number, userId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/manage-user-post-like-dislike`,
                {
                    postId,
                    userId,
                    flag: 'DISLIKE'
                },
                {headers}
            );
        });
    }
    incrementViewCounter(postId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorUserPage()}/increment-user-post-view-counter`,
                {postId},
                {headers}
            );
        });
    }
}
