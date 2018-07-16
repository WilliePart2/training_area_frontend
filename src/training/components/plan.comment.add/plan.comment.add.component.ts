import { Component, Output, Input, EventEmitter, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { LabelService } from '../../../common/label.service';

import { TrainingCommentCommands } from '../../models/training.comment.commands';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { ActionModel } from '../../../common/models/action.model';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';

@Component({
    selector: 'training-comment-add-item',
    templateUrl: './plan.comment.add.component.html'
})

export class PlanCommentAddComponent implements OnInit, AfterViewInit, OnDestroy {
    text: string;
    dimmed: boolean;
    dimmerMessage: string;
    hasError: boolean;
    _errorMessage: string;
    @Output() addCommentEvent = new EventEmitter();
    @Input() commandFromController: Observable<any>;

    @ViewChild('commentText') commentTextarea: ElementRef;
    inputKeysSubscription: Subscription;

    commandSubscription: Subscription;

    _commonLabels: TrainingCommonLabels;
    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    constructor(
        private labelService: LabelService
    ) {}

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];

        if (this.commandFromController) {
            this.commandSubscription = this.commandFromController.subscribe((action: ActionModel) => {
                switch (action.type) {
                    case TrainingCommentCommands.ENABLE_FIELD_DIMMER: this.enableDimmer(this._dimmerLabels.TP_COMMENT_SEND_MESSAGE_MSG); break;
                    case TrainingCommentCommands.DISABLE_FIELD_DIMMER: this.disableDimmer(); break;
                    case TrainingCommentCommands.SUCCESS_ADDED_COMMENT: this.clearText(); break;
                    case TrainingCommentCommands.ERROR_ADDED_COMMENT: this.errorMessage(this._errorLabels.ERROR_ADDING_COMMENT); break;
                }
            });
        }
    }

    ngAfterViewInit() {
        const ENTER_KEY = 13;
        if (this.commentTextarea) {
            this.inputKeysSubscription = fromEvent(this.commentTextarea.nativeElement, 'keydown').subscribe((event: KeyboardEvent) => {
                if (event.keyCode === ENTER_KEY && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
                    event.preventDefault();
                    this.createNewComment();
                }
            });
        }
    }

    ngOnDestroy() {
        if (this.commandSubscription) { this.commandSubscription.unsubscribe(); }
        if (this.inputKeysSubscription) { this.inputKeysSubscription.unsubscribe(); }
    }

    createNewComment() {
        this.disableErrorMessage();
        this.addCommentEvent.emit(this.text.trim());
    }

    enableDimmer(msg?: string) {
        this.dimmerMessage = msg || '';
        this.dimmed = true;
    }
    disableDimmer() {
        this.dimmed = false;
        this.dimmerMessage = '';
    }

    clearText() {
        this.text = '';
    }
    errorMessage(msg?: string) {
        this._errorMessage = msg || '';
        this.hasError = true;
    }
    disableErrorMessage() {
        this.hasError = false;
        this._errorMessage = '';
    }
}
