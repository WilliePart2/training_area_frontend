import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserManagerService } from '../../common/user.manager.service';
import { BaseService } from '../../common/base.service';
import { UrlService } from '../../common/url.service';

@Injectable()
export class CommentService extends BaseService {

    constructor(
        protected userManager: UserManagerService,
        protected http: HttpClient,
        private urlService: UrlService
    ) {
        super(userManager, http);
    }

    /** Управление коментариями */
    getCommentList(planId: number, offset: number, limit: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/get-comment-list?id=${planId}&offset=${offset}&limit=${limit}`,
                {headers}
            );
        });
    }

    addComment(planId: number, text: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/add-comment`,
                {
                    CommentManager: {
                        planId,
                        text
                    },
                },
                {headers}
            );
        });
    }

    removeComment(commentId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/delete-comment`,
                {
                    CommentManager: {
                        commentId
                    }
                },
                {headers}
            );
        });
    }

    modifyComment(commentId: number, addingText: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/modify-comment`,
                {
                    CommentManager: {
                        commentId,
                        addingText
                    }
                },
                {headers}
            );
        });
    }
    /** Управление like/dislike */
    private markManager(commentId: number, url: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/${url}`,
                {
                    CommentManager: {
                        commentId
                    }
                },
                {headers}
            );
        });
    }
    addLike(commentId: number) {
        return this.markManager(commentId, 'add-like');
    }

    removeLike(commentId: number) {
        return this.markManager(commentId, 'remove-like');
    }

    addDislike(commentId: number) {
        return this.markManager(commentId, 'add-dislike');
    }

    removeDislike(commentId: number) {
        return this.markManager(commentId, 'remove-dislike');
    }
}
