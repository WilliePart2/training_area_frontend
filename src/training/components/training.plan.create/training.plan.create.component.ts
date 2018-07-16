import { Component, OnInit } from '@angular/core';
import { TrainingPlanService } from '../../services/training.plan.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { LabelService } from '../../../common/label.service';

import { ExerciseModel } from '../../models/exercise.model';
import { EditExerciseModel } from '../../models/edit.exercise.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';

@Component({
    selector: 'training-plan-create',
    templateUrl: './training.plan.create.component.html',
    styleUrls: ['./training.plan.create.compponent.css']
})

export class TrainingPlanCreateComponent extends ProtectedComponent implements OnInit {
    _name: string;
    set name(val: string) {
        this._name = val;
        this.resetErrors();
    }
    get name() { return this._name; }
    readme: string;
    _visible: number;
    set visible(val: number) {
        this._visible = val;
        this.resetErrors();
    }
    get visible() { return this._visible; }
    _category: number;
    set category(val: number) {
        this._category = val;
        this.resetErrors();
    }
    get category() { return this._category; }
    isEmpty = true;
    errorMessages: string [];
    isErrDimmerEnabled: boolean;
    /** Общее хранилище упражнений */
    exercises: ExerciseModel [] = [];
    /** Хранидище упражнений отфильтрованых по мышечной группе */
    exerciseStore: ExerciseModel [];
    /** Хранидище груп отфильтрованых по упражнению */
    groupStore: ExerciseModel [];

    selectedExercise: any;
    selectedGroup: any;

    addedExercises: EditExerciseModel [] = [];

    sendingRequest: boolean;

    _commonLabels: TrainingCommonLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        protected userManager: UserManagerService,
        private planService: TrainingPlanService,
        private route: ActivatedRoute,
        private labelService: LabelService
    ) {
        super(userManager);
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];

        this.enableDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.initialize().subscribe(_ => {
            this.disableDimmer();
        }, _ => {
            this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
            this.disableDimmer();
        });
        this.errorMessages = [];
    }

    initialize() {
        return Observable.create(observer => {
            this.planService.loadExerciseList().subscribe(response => {
                this.checkResponse(response, this.initializeHandler.bind(this));
                if (!response || !response['result']) {
                    observer.error();
                }
                observer.next();
                observer.complete();
            }, error => {
                observer.error();
            });
        });
    }
    initializeHandler(response) {
        this.exercises = response['data'];
        this.exerciseStore = this.exercises;
        this.groupStore = this.exercises;
    }

    /** Обработчики событий */
    /** Ограничиваем список упражнений соласно выбраной группе */
    chooseGroup(groupName: string) {
        this.exerciseStore = this.exercises.filter((item: ExerciseModel) => item.group === groupName);
    }

    /** Добавляет упражнение */
    addExercise() {
        this.resetErrors();
        const exercise = this.exercises.find((item: ExerciseModel) => item.id === this.selectedExercise);
        if (!exercise) {
            this.errorMessages.push(this._errorLabels.ADDING_ERROR_MESSAGE);
            this.enableErrorDimmer();
            return;
        } else {
            this.resetErrors();
        }
        this.addedExercises.push({
            id: exercise.id,
            name: exercise.name,
            uniqueId: `${exercise.id}_${Date.now()}`,
            oneRepeatMaximum: 0,
            group: exercise.group
        });
        this.isEmpty = false;
    }

    /** Удаляет упражнение */
    removeAddedItem(uniqueId: string) {
        this.addedExercises = this.addedExercises.filter(item => item.uniqueId !== uniqueId);
        if (!this.addedExercises.length) { this.isEmpty = true; }
    }
    /** Метод для теста */
    viewAddedItem(uniqueId: string) {
        console.log(this.addedExercises.find(item => item.uniqueId === uniqueId));
    }

    /** Сохраняет созданый тренировочный план на сервере */
    saveTrainingPlan() {
        if (this.checkFields()) {
            this.enableErrorDimmer();
            return;
        }
        this.resetErrors();

        this.enableRequestSending();
        this.planService.saveTrainingPlan({
            name: this.name,
            readme: this.readme || '',
            visible: this.visible ? this.visible : 0,
            category: this.category ? this.category : 0,
            trainingPlanData: this.addedExercises
        }).subscribe(response => {
            this.checkResponse(response, this.saveTrainingPlanHandler.bind(this));
            if (!response || !response['result']) {
                this.errorMessages.push(this._errorLabels.STD_HTTP_SEND_ERROR);
                this.enableErrorDimmer();
            }
            this.disableRequestSending();
        }, error => {
            this.errorMessages.push(this._errorLabels.STD_HTTP_SEND_ERROR);
            this.enableErrorDimmer();
            this.disableRequestSending();
        });
    }
    saveTrainingPlanHandler(response) {
        let urlFromRoot = '';
        const componentForView = 'training-plan-view';
        this.route.pathFromRoot.forEach(route => {
            urlFromRoot += `${route.snapshot.url}-`;
        });
        if (urlFromRoot.indexOf('mentor') !== -1) {
            this.userManager.redirectUser(`/mentor/training/${componentForView}`, {id: response['data']});
        } else {
            this.userManager.redirectUser(`/user/training/${componentForView}`, {id: response['data']});
        }
    }
    /** Метод проверяет на наличие ошибок */
    checkFields() {
        let result = false;
        if (this.isEmpty) {
            result = true;
            this.errorMessages.push(this._errorLabels.CREATE_TP_ERROR_MSG_1);
        }
        if (!this.name || !this.name.trim()) {
            result = true;
            this.errorMessages.push(this._errorLabels.CREATE_TP_ERROR_MSG_2);
        }
        if (!this.visible) {
            result = true;
            this.errorMessages.push(this._errorLabels.CREATE_TP_ERROR_MSG_3);
        }
        if (!this.category) {
            result = true;
            this.errorMessages.push(this._errorLabels.CREATE_TP_ERROR_MSG_4);
        }
        return result;
    }
    resetErrors() {
        this.isErrDimmerEnabled = false;
        this.errorMessages = [];
    }
    enableErrorDimmer() {
        this.isErrDimmerEnabled = true;
    }
    enableRequestSending() {
        this.sendingRequest = true;
    }
    disableRequestSending() {
        this.sendingRequest = false;
    }
}
