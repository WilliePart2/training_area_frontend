import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { CommentService } from '../../services/comment.service';
import { LabelService } from '../../../common/label.service';
import { Observer } from 'rxjs/Observer';

import { CommentItemModel } from '../../models/comment.item.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { TrainingCommentCommands } from '../../models/training.comment.commands';
import { ActionModel } from '../../../common/models/action.model';
import { fromEvent } from 'rxjs/observable/fromEvent';

@Component({
    selector: 'training-plan-view-comment',
    templateUrl: './training.plan.view.comment.component.html',
    styleUrls: ['./training.plan.view.comment.component.css'],
    providers: [
        {provide: 'Window', useValue: window}
    ]
})

export class TrainingPlanViewCommentComponent extends ProtectedComponent implements OnInit {
    _dimmed = false;
    planId: number;
    comments: CommentItemModel [] = [];
    get page() {
        return this._page;
    }
    set page(value: number) {
        console.log('+');
        this._page = value;
        this.correctOffset();
        this._pageChangeObserver.next(null);
    }
    _pageChangeObserver: Observer<any>;
    pageChangeSubscription: Subscription;

    getIdSubscription: Subscription;
    contactToParts: Subject<any>;

    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    constructor (
        protected userManager: UserManagerService,
        private activeRoute: ActivatedRoute,
        private commentService: CommentService,
        private labelService: LabelService,
        @Inject('Window') private _window
    ) {
        super(userManager);
        this.step = 5;
        this.limit = this.step;
    }
    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.getId().subscribe(() => {
            this.initialize().subscribe(() => {
                this.disableDimmer();
            }, error => {
                this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                this.disableDimmer();
            });
        }, err => {
                this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                this.disableDimmer();
            }
        );

        this.contactToParts = new Subject();

        this.pageChangeSubscription = Observable.create(observer => this._pageChangeObserver = observer).subscribe(() => {
            this.enableDimmer();
            this.initialize().subscribe(_ => {
                this.disableDimmer();
                this.smoothScrollTop(500);
            }, _ => {
                this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                this.disableDimmer();
            });
        });
    }
    getId() {
        return Observable.create(observer => {
            this.activeRoute.queryParams.subscribe(params => {
                if (params.id) {
                    this.planId = params.id;
                    observer.next();
                    observer.complete();
                } else {
                    observer.error();
                }
            });
        });
    }
    initialize() {
        return Observable.create(observer => {
            this.commentService.getCommentList(this.planId, this.offset, this.limit).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.comments = resp['data']['comments'];
                    this.totalCount = resp['data']['totalCount'];
                    observer.next();
                    observer.complete();
                });
                if (response && !response.result) {
                    observer.next();
                    observer.complete();
                }
            }, error => {
                observer.error();
            });
        });
    }
    /** Обработчик добавления коментария */
    addCommentHandler(data: string) {
        this.enableFieldDimmer();
        this.commentService.addComment(this.planId, data).subscribe(response => {
            this.checkResponse(response, resp => {
                this.comments = [resp['data'], ...this.comments];
                this.successfullAddedComment();
            });
            if (!response || !response.result) {
                this.errorAddedComment();
            }
            this.disableFieldDimmer();
        }, error => {
            // this.globalErrorMessage(this._errorLabels.ERROR_ADDING_COMMENT);
            this.errorAddedComment();
            this.disableFieldDimmer();
        });
    }
    /** Обработчик удаления коментария */
    deleteCommentHandler(commentId: number) {
        this.enableDimmer();
        this.commentService.removeComment(commentId).subscribe(response => {
            this.checkResponse(response, resp => {
                this.initialize().subscribe(_ => {
                    this.disableDimmer();
                }, _ => {
                    this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                });
            });
            if (!response || !response.result) {
                this.disableDimmer();
            }
        }, error => {
            this.errorMessage(this._errorLabels.ERROR_DELETING_COMMENT);
            this.disableDimmer();
        });
    }

    /**
     * method which animate scroll
     */
    smoothScrollTop(duration: number) {
        const document = this._window.document;
        const contentSize = Math.max(
            document.documentElement.clientHeight, document.body.clientHeight,
            document.documentElement.offsetHeight, document.body.offsetHeight,
            document.documentElement.scrollHeight, document.body.scrollHeight
        );
        const offset = pageYOffset || document.documentElement.scrollTop;
        if (!offset) { return; }
        const frequent = 1000 / 60;
        const stepCount = duration / frequent;
        const stepSize = offset / stepCount;
        let previousValue = 0;
        const animate = setInterval(_ => {
            document.documentElement.scrollTop -= stepSize;
            if (previousValue === document.documentElement.scrollTop) {
                clearInterval(animate);
            } else {
                previousValue = document.documentElement.scrollTop;
            }
        }, frequent);
    }

    /**
     * commands for other components
     */
    enableFieldDimmer() {
        this.contactToParts.next(new ActionModel(
            TrainingCommentCommands.ENABLE_FIELD_DIMMER,
            null
        ));
    }
    disableFieldDimmer() {
        this.contactToParts.next(new ActionModel(
            TrainingCommentCommands.DISABLE_FIELD_DIMMER,
            null
        ));
    }
    successfullAddedComment() {
        this.contactToParts.next(new ActionModel(
            TrainingCommentCommands.SUCCESS_ADDED_COMMENT,
            null
        ));
    }
    errorAddedComment() {
        this.contactToParts.next(new ActionModel(
            TrainingCommentCommands.ERROR_ADDED_COMMENT,
            null
        ));
    }
    resetErrorMessage() {
        super.resetErrorMessage();
    }
}
