import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { timer } from 'rxjs/observable/timer';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { CommentItemModel } from '../../models/comment.item.model';
import { UserManagerService } from '../../../common/user.manager.service';
import { CommentService } from '../../services/comment.service';
import * as moment from 'moment';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';

@Component({
    selector: 'training-comment-item',
    templateUrl: './plan.comment.component.html',
    styleUrls: ['./plan.comment.component.css']
})

export class PlanCommentComponent extends ProtectedComponent implements OnInit, OnDestroy {
    userId: number;
    @Input() item: CommentItemModel;
    modifyModeEnabled = false;
    modificationText: string;
    dateValues: {id: number, date: string}[] = [];
    updateDateSub: Subscription;
    updateAddingTextSub: Subscription;
    modTASub: Subscription;
    @Output() hasRemoveComment = new EventEmitter <number> ();

    likeRequestProccessing: boolean;
    dislikeRequestProccessing: boolean;

    @ViewChild('modifyCommentTextarea') modifyingCommentTextarea: ElementRef;
    modCommentDimmer: boolean;
    modCommentDimmerMessage: string;
    hasModifyCommentError: boolean;
    modifyCommentErrorMessage: string;

    _commonLabels: TrainingCommonLabels;
    _errorLabels: ErrorLabelsModel;

    constructor(
        protected userManager: UserManagerService,
        private commentService: CommentService,
        private labelService: LabelService,
        private zone: NgZone
    ) {
        super(userManager);
        this.userId = this.userManager.id;
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        const resourceDate = this.item.date;
        this.updateDateSub = timer(0, 1000).subscribe(_ => {
            this.item.date = this.fromNow(resourceDate);
        });
        if (this.item.addingText) {
            this.dateValues = this.item.addingText.map(addingItem =>  {
                return {
                    id: addingItem.id,
                    date: addingItem.date
                };
            });
            this.updateAddingTextSub = timer(0, 1000).subscribe(_ => {
                this.item.addingText = this.item.addingText.map(addingItem => {
                    const dateValue = this.dateValues.find(item => item.id === addingItem.id);
                    if (dateValue) {
                        addingItem.date = this.fromNow(dateValue.date);
                    }
                    return addingItem;
                });
            });
        }
    }

    attachModTextaredHandler() {
        const ENTER_KEY = 13;
        if (this.modifyingCommentTextarea) {
            this.modTASub = fromEvent(this.modifyingCommentTextarea.nativeElement, 'keydown').subscribe((event: KeyboardEvent) => {
                if (event.keyCode === ENTER_KEY && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
                    event.preventDefault();
                    this.enableDimmer();
                    this.modifyComment().subscribe(_ => {
                        this.disableModError();
                        this.disableModDimmer();
                        this.modTASub.unsubscribe();
                    }, _ => {
                        this.enableModError(this._errorLabels.STD_HTTP_SEND_ERROR);
                        this.disableModDimmer();
                    });
                }
            });
        }
    }

    ngOnDestroy() {
        if (this.modTASub) { this.modTASub.unsubscribe(); }
        if (this.updateDateSub) { this.updateDateSub.unsubscribe(); }
        if (this.updateAddingTextSub) { this.updateAddingTextSub.unsubscribe(); }
    }

    toggleLike() {
        this.likeRequestProccessing = true;
        if (this.item.hasLike) {
            this.commentService.removeLike(this.item.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.item.like = this.item.like - 1;
                    this.item.hasLike = false;
                });
                this.likeRequestProccessing = false;
            }, error => {
                this.likeRequestProccessing = false;
            });
        } else {
            this.commentService.addLike(this.item.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.item.like = this.item.like + 1;
                    this.item.hasLike = true;
                });
                this.likeRequestProccessing = false;
            }, error => {
                this.likeRequestProccessing = false;
            });
        }
    }
    toggleDislike() {
        this.dislikeRequestProccessing = true;
        if (this.item.hasDislike) {
            this.commentService.removeDislike(this.item.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.item.dislike = this.item.dislike - 1;
                    this.item.hasDislike = false;
                });
                this.dislikeRequestProccessing = false;
            }, error => {
                this.dislikeRequestProccessing = false;
            });
        } else {
            this.commentService.addDislike(this.item.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.item.dislike = this.item.dislike + 1;
                    this.item.hasDislike = true;
                });
                this.dislikeRequestProccessing = false;
            }, error => {
                this.dislikeRequestProccessing = false;
            });
        }
    }
    /** Включчает\Отключает режим редактирвоания */
    enableModifyMode() {
        this.modifyModeEnabled = true;
        this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(_ => {
            this.attachModTextaredHandler();
        });
    }
    disableModifyMode() {
        this.modifyModeEnabled = false;
        this.modificationText = '';
        this.disableModError();
    }
    /** Обработчик добавления дополнительного текста */
    modifyComment() {
        return Observable.create(observer => {
            const content = this.modificationText.trim();
            if (content) {
                this.commentService.modifyComment(this.item.id, content).subscribe(response => {
                    this.checkResponse(response, resp => {
                        this.item = {
                            ...this.item,
                            addingText: [...this.item.addingText, {
                                ...resp['data'],
                                date: this.fromNow(resp['data']['date'])
                            }]
                        };
                        this.dateValues = [...this.dateValues, {
                            id : resp['data']['id'],
                            date: resp['data']['date']
                        }];
                        this.modificationText = '';
                        this.modifyModeEnabled = false;
                    });

                    observer.next();
                    observer.complete();
                }, error => {
                    this.disableModDimmer();
                    observer.error();
                });
            } else {
                observer.next();
                observer.complete();
            }
        });
    }

    modifyCommentWrapper() {
        this.enableModDimmer();
        this.modifyComment().subscribe(_ => {
            this.disableModError();
            this.disableModDimmer();
        }, _ => {
            this.disableModDimmer();
            this.enableModError(this._errorLabels.STD_HTTP_SEND_ERROR);
        });
    }

    removeComment() {
        this.hasRemoveComment.emit(this.item.id);
    }
    fromNow(datestring: string) {
        return moment.utc(datestring, 'YYYY-MM-DD HH:mm:ss', 'ru', true).local().fromNow();
    }
    enableModDimmer(msg?: string) {
        this.modCommentDimmerMessage = msg || '';
        this.modCommentDimmer = true;
    }
    disableModDimmer() {
        this.modCommentDimmer = false;
        this.modCommentDimmerMessage = '';
    }
    enableModError(msg?: string) {
        this.modifyCommentErrorMessage = msg || '';
        this.hasModifyCommentError = true;
    }
    disableModError() {
        this.hasModifyCommentError = false;
        this.modifyCommentErrorMessage = '';
    }
}
