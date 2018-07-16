import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    OnChanges,
    OnInit,
    AfterViewInit,
    OnDestroy,
    SimpleChanges,
    ViewChildren,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    NgZone
} from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import * as Immutable from 'immutable';
import { take } from 'rxjs/operator/take';
import { LogService } from '../../../common/log.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { MicrocicleService } from '../../services/microcicle.service';
import { SuiModalService, TemplateModalConfig, ModalTemplate } from 'ng2-semantic-ui';
import { TrainingService } from '../../services/training.service';
import { BurdenCalcService } from '../../services/burden.calc.service';
import { BindTrainingService } from '../../services/bind.training.service';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import * as actions from '../../actions/actions.type';
import { MakeTrainingService } from '../../services/make.training.service';
import { Observable } from 'rxjs/Observable';
import { LabelService } from '../../../common/label.service';
import { TotalMessageService } from '../../../for.all.users/services/total.message.service';

import { CompletedTrainingModel } from '../../models/completed.data.models';
import { TrainingModel } from '../../models/training.model';
import { LayoutExerciseModel } from '../../models/layout.exercise.model';
import { Exercise } from '../../models/layout.exercise.model';
import { TrainingExerciseModel } from '../../models/training.exercise.model';
import { IDelete } from '../exercise.item/exercise.item.component';
import { BasePlanItemModel } from '../../models/base.plan.item.model';
import { UsersPlanDataModel } from '../../models/users.plan.data.model';
import { ICompleteTraining } from '../../models/complete.training.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { TrainingActionLabels } from '../../../common/models/training.action.labels';
import { TrainingMessageLabels } from '../../../common/models/training.message.labels';

import { IImmutableBaseList, IImmutableBaseMap } from '../../models/immutable.base';
import { IImmutableTrainingModel } from '../../models/training.model';
import { IImmutableTrainingExerciseModel } from '../../models/training.exercise.model';
import { IListPlansForPerformModel, IPlanForPerformMutableModel } from '../../models/plan.for.perform.model';
import { ENTrainingExerciseCommands } from '../../models/training.exercise.commands.model';

interface IExerciseAddContext {
    trainingName: string;
    list: Exercise [];
}

interface IDeleteTrainingContext {
    deleteTrainingPromptMessage: string;
}

interface IDeleteExerciseContext {
    deleteExercisePromptMessage: string;
}

interface IErrorContext {
    message: string;
}

@Component({
    selector: 'training-item',
    templateUrl: 'training.item.component.html',
    styleUrls: ['./training.item.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MakeTrainingService]
})

export class TrainingItemComponent extends ProtectedComponent implements OnChanges, OnInit, OnDestroy {
    observableCore: Subscription;
    isEditable: boolean; /** Флаг указывающий на редактирование тренировки(только в редиме own) */
    isHanding: boolean; /** Переключатель режима сбора данных тренировки */
    isCompleted: boolean;
    isTrainingBegin: boolean;
    isDropdownMenuOpen: boolean;
    isPrepared: boolean; /** Флаг подготовки данных к редактированию */
    isInitialize: boolean; /** Флаг устанавливаеться при первой иницыализации */
    @Input() planId: number;
    @Input() visible: boolean; /** Когда тренировка не отображаеться вычисления в ней не выполняються */
    @Input() mode: 'view' | 'edit' | 'own' | 'complete' | 'process';
    previousMode: 'view' | 'edit' | 'own' | 'complete' | 'process';
    _training: TrainingModel;
    _immutableTraining: IImmutableTrainingModel;
    @Input() set training(item: TrainingModel) {
        this._training = item;
        this._immutableTraining = Immutable.fromJS(item);
    }
    get training(): TrainingModel { return this._training; }
    set imTraining(item: IImmutableTrainingModel) { this._immutableTraining = item; }
    get imTraining(): IImmutableTrainingModel { return this._immutableTraining; }

    oldTrainings: IImmutableTrainingModel; /* нужно или нет? */
    @Output() exerciseDelete = new EventEmitter <TrainingExerciseModel>();
    @Output() planDelete = new EventEmitter <BasePlanItemModel> ();
    /* Свойства для обработки информации по тренировке */
    @Input() trainingSessionId: string;
    @Input() completedTrainings: IImmutableBaseList<IImmutableBaseMap<CompletedTrainingModel>>;
    @Input() completedUserPlans: IListPlansForPerformModel;
    @Output() completeTraining = new EventEmitter <IListPlansForPerformModel> ();
    @Output() editCompletedTraining = new EventEmitter <IListPlansForPerformModel> ();
    /** Список упражнений из шаблона тренировочного плана */
    _exerciseList: Exercise [];
    @Input() set exerciseList(items: LayoutExerciseModel []) {
        this._exerciseList = items.map(item => {
            return {
                ...item,
                checked: false
            };
        });
    }
    get exerciseList() {
        return this._exerciseList.map(item => {
            return {
                ...item,
                checked: false
            };
        });
    }
    /** Свойства для управления модальными окнами */
    @ViewChild('deleteTrainingModal') deleteTrainingModal: ModalTemplate<IDeleteTrainingContext, any, any>;
    @ViewChild('deleteExerciseModal') deleteExerciseModal: ModalTemplate<IDeleteExerciseContext, any, any>;
    @ViewChild('addExerciseModal') addExerciseModal: ModalTemplate<IExerciseAddContext, any, any>;
    @ViewChild('errorModal') errorModal: ModalTemplate <IErrorContext, any, any>;
    checkedExercises: Exercise [] = [];

    /** Свойство для управления хранилишем тренировок */
    oldExercise: IImmutableBaseList<IImmutableTrainingExerciseModel>;
    newExercise: IImmutableBaseList<IImmutableTrainingExerciseModel>;
    counter = 0;

    relationWithExercises: Subject<any>;

    _commonLabels: TrainingCommonLabels;
    _actionLabels: TrainingActionLabels;
    _messageLabels: TrainingMessageLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;
    constructor(
        private loger: LogService,
        private microcicleService: MicrocicleService,
        private trainingService: TrainingService,
        private calcService: BurdenCalcService,
        private modalService: SuiModalService,
        private shareService: BindTrainingService,
        private detectorRef: ChangeDetectorRef,
        private makerService: MakeTrainingService,
        protected userManager: UserManagerService,
        private labelService: LabelService,
        private messageService: TotalMessageService,
        private zone: NgZone
    ) {
        super(userManager);
        this.mode = this.mode ? this.mode : 'view';
        this.previousMode = this.mode;
        this.isCompleted = false;
        this.isDropdownMenuOpen = false;
        this.isInitialize = false;
        this.isTrainingBegin = false;
        this.isHanding = false;
        this.isPrepared = false;
        this.isEditable = false;

        this.enableDimmer = this.enableDimmer.bind(this);
        this.disableDimmer = this.disableDimmer.bind(this);
        this.errorMessage = this.errorMessage.bind(this);
    }
    ngOnChanges(changes: SimpleChanges) {
        if (this.visible || (changes.visible && changes.visible.currentValue)) {
            this.checkTraining();
            /** Свойства которые иницыализируються только при первом запуске */
            if (!this.isInitialize) {
                this.oldExercise = <IImmutableBaseList<IImmutableTrainingExerciseModel>> this.imTraining.get('exercises');
                this.isInitialize = true;
            }
        }
        if (this.isHanding || this.isEditable) {
            if (changes.training || changes.training.currentValue !== changes.training.previousValue) {
                this.training = this.makerService.preparePlanForEdit(this.imTraining, this.completedUserPlans).toJS();
            }
            return;
        }
        if (this.isTrainingBegin && changes.training && changes.training.currentValue !== changes.training.previousValue) {
            this.training = this.makerService.prepareTrainingForPerform(this.imTraining).toJS();
            return;
        }
    }

    ngOnInit() {
        /* подписываемся на обновления данных */
        this.observableCore = this.shareService.getCore().subscribe(action => {
            switch (action.type) {
                case actions.DELETE_EXERCISE: {
                    if (this.imTraining.get('id') !== action.data.get('trainingId')) { return; }
                    this.deleteExerciseFromTraining(action.data);
                } break;
                case actions.UPDATE_EXERCISE: {
                    this.changeExercise(action.data);
                } break;
                case actions.SHALOW_UPDATE_EXERCISE: {
                    (() => {
                        if (this.imTraining.get('id') !== action.data.get('trainingId')) { return; }
                        this.changeExercise(<IImmutableTrainingExerciseModel>action.data, true);
                        this.checkTraining();
                    })();
                } break;
            }
        });
        this.newExercise = Immutable.List();
        this.oldExercise = this.oldExercise ? this.oldExercise : Immutable.List();

        /* иницыализация даных для обработки тренировки */
        this.checkTraining();

        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._actionLabels = labels[LABEL_GROUP_NAMES.TRAINING_ACTION_LABLES];
        this._messageLabels = labels[LABEL_GROUP_NAMES.TRAINING_MESSAGE_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];

        this.relationWithExercises = new Subject();
    }
    ngOnDestroy() {
        if (this.observableCore) {
            this.observableCore.unsubscribe();
        }
    }

    exerciseResetFocus() {
        this.relationWithExercises.next(ENTrainingExerciseCommands.RESET_FOCUS);
    }

    exerciseResetBoolFlags() {
        this.relationWithExercises.next(ENTrainingExerciseCommands.RESET_BOOLEAN_FLAGS);
    }

    /** Метод проверяет тренировку не пройдена ли она */
    checkTraining() {
        if (this.completedTrainings && this.completedTrainings.size) {
            const completedTraining = this.completedTrainings.find(completeItem => {
                return completeItem.get('id') === this.imTraining.get('id');
            });
            if (completedTraining) {
                this.isCompleted = true;
            }
        }
        return;
        /** it's inadvisable code */
        // if (this.isTrainingBegin) {
        //     if (this.makerService.checkTrainingPerforming(this.imTraining)) {
        //         this.changeState(this.enableDimmer, this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        //         this.endTraining('newSave').subscribe(() => {
        //             this.isTrainingBegin = false;
        //             this.isCompleted = true;
        //             this.imTraining = <IImmutableTrainingModel> this.makerService.removeDataForPerformFromTraining(
        //                 this.imTraining
        //             );
        //             this.training = this.imTraining.toJS();
        //             this.changeState(this.disableDimmer);
        //             this.messageService.sendSuccessMessage(this._actionLabels.TRAINING_SUCCESSFULL_COMPLETE);
        //         }, error => {
        //             this.changeState([
        //                 this.disableDimmer.bind(this),
        //                 [this.errorMessage.bind(this), this._dimmerLabels.STD_HTTP_DIMMER_ERROR_MSG]
        //             ]);
        //         });
        //     }
        // }
    }
    /** Методы управления редактированием */
    enableEditMode() {
        if (!this.isCompleted) { return; }
        this.changeState(this.enableDimmer, this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.imTraining = <IImmutableTrainingModel>this.makerService.preparePlanForEdit(
            this.imTraining,
            this.completedUserPlans
        );
        this.training = this.imTraining.toJS();
        this.isEditable = true;
        if (this.isHanding) { this.isHanding = false; }
        this.changeState(this.disableDimmer);
        // this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(_ => this.exerciseCreateBoolFlags());
    }
    saveEditVersion() {
        if (!this.isCompleted) { return; }
        this.changeState(this.enableDimmer, this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.endTraining('editSave').subscribe(response => {
            this.exerciseResetFocus();
            this.exerciseResetBoolFlags();
                this.isEditable = false;
                this.imTraining = <IImmutableTrainingModel> this.makerService.removeDataForPerformFromTraining(
                    this.imTraining
                );
                this.training = this.imTraining.toJS();
                this.changeState(this.disableDimmer);
                this.messageService.sendSuccessMessage(this._actionLabels.TRAINING_RESULT_SUCCESSFULL_EDITED);
        }, error => {
            this.exerciseResetFocus();
            this.changeState(
                [
                    this.disableDimmer.bind(this),
                    [this.errorMessage, this._dimmerLabels.STD_HTTP_DIMMER_ERROR_MSG]
                ]
            );
        });
    }
    disableEditMode() {
        this.changeState(this.enableDimmer, this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.exerciseResetFocus();
        this.exerciseResetBoolFlags();
        this.isEditable = false;
        this.imTraining = <IImmutableTrainingModel> this.makerService.removeDataForPerformFromTraining(
            this.imTraining
        );
        this.training = this.imTraining.toJS();
        this.changeState(this.disableDimmer);
    }
    /** Методы управления протеканием тренировки */
    beginTraining() {
        this.changeState(this.enableDimmer, this._dimmerLabels.TR_PREPARE_TRAINING_DATA);
        this.isTrainingBegin = true;
        this.training = this.makerService.prepareTrainingForPerform(this.imTraining).toJS();
        // this.exerciseCreateBoolFlags(); /** it must perform async */
        this.changeState(this.disableDimmer);
    }
    endTraining(mode: 'newSave' | 'editSave') {
        this.isTrainingBegin = false;
        return Observable.create(observer => {
            const perfPlans = this.makerService.getAllPerfPlansFromTraining(this.imTraining);
            const plans: {newItems: Array<IPlanForPerformMutableModel>, modifiedItems: Array<IPlanForPerformMutableModel>} = {
                newItems: <Array<IPlanForPerformMutableModel>> null,
                modifiedItems: <Array<IPlanForPerformMutableModel>> null
            };
            if (mode === 'newSave') {
                plans.newItems = perfPlans.toJS();
            }
            if (mode === 'editSave') {
                plans.modifiedItems = perfPlans.toJS();
            }
            const dataForServer: ICompleteTraining = {
                plans: plans,
                trainingPlanId: this.planId,
                trainingId: this.imTraining.get('id'),
                trainingSessionId: this.trainingSessionId
            };
            this.trainingService.setTrainingAsComplete(dataForServer).subscribe(response => {
                this.checkResponse(response, resp => {
                    if (mode === 'newSave') {
                        this.completeTraining.emit(
                            this.makerService.updateIdInPerformItems(perfPlans, Immutable.fromJS(resp.data))
                        );
                    }
                    if (mode === 'editSave') {
                        this.editCompletedTraining.emit(perfPlans);
                    }
                    observer.next();
                    observer.complete();
                });
            }, error => {
                observer.error();
            });
        });
    }
    manualEndTraining() {
        this.changeState(this.enableDimmer, this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.isTrainingBegin = false;
        this.endTraining('newSave').subscribe(() => {
            this.exerciseResetFocus(); /** testing */
            this.exerciseResetBoolFlags();
            this.isCompleted = true;
            this.imTraining = <IImmutableTrainingModel> this.makerService.removeDataForPerformFromTraining(
                this.imTraining
            );
            this.training = this.imTraining.toJS();
            this.changeState(this.disableDimmer.bind(this));
            this.messageService.sendSuccessMessage(this._actionLabels.TRAINING_SUCCESSFULL_COMPLETE);
        }, error => {
            this.exerciseResetFocus(); /** testing */
            this.changeState(
                [
                    this.disableDimmer.bind(this),
                    [this.errorMessage, this._dimmerLabels.STD_HTTP_DIMMER_ERROR_MSG]
                ]
            );
        });
    }
    /** Управления режимом обработки данных */
    enableHandleMode() {
            this.changeState(this.enableDimmer, this._dimmerLabels.STD_HTTP_DIMMER_MSG);
            this.isHanding = true;
            this.imTraining = <IImmutableTrainingModel>this.makerService.preparePlanForEdit(
                this.imTraining,
                this.completedUserPlans
            );
            this.training = this.imTraining.toJS();
            this.changeState(this.disableDimmer);
            // this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(() => this.exerciseCreateBoolFlags());
    }
    disableHandleMode() {
            this.changeState(this.enableDimmer.bind(this), this._dimmerLabels.STD_HTTP_DIMMER_MSG);
            this.exerciseResetFocus();
            this.exerciseResetBoolFlags();
            this.isHanding = false;
            this.imTraining = <IImmutableTrainingModel>this.makerService.removeDataForPerformFromTraining(
                this.imTraining
            );
            this.training = this.imTraining.toJS();
            this.changeState(this.disableDimmer);
    }
    /** Методы для работы с модальным окном */
    /** Метод обрабатывает добавление упражнения в тренировку */
    addExerciseToTraining(trainingName: string) {
        const config = new TemplateModalConfig<IExerciseAddContext, any, any>(this.addExerciseModal);
        config.context = {
            trainingName: this.training.name,
            list: <Exercise []> this.exerciseList
        };
        this.modalService
            .open(config)
            .onApprove(() => {
                /* подготавливаем данные */
                const preparedExercises: IImmutableBaseList<IImmutableTrainingExerciseModel> = Immutable.fromJS(
                    this.checkedExercises.map(checkItem => {
                        return this.trainingService.createExercise(this.training.id, checkItem);
                    })
                );
                /* сохраняем данные в распределенных хранилищах */
                if (!this.newExercise || !this.newExercise.size) {
                    this.newExercise = preparedExercises;
                } else {
                    this.newExercise = <IImmutableBaseList<IImmutableTrainingExerciseModel>>this.newExercise.concat(
                            preparedExercises
                        );
                }
                /* синхронизируем компоненты */
                this.shareService.updateTrainingData(
                        <IImmutableTrainingModel>this.imTraining.update('exercises', () => {
                            return this.oldExercise.concat(this.newExercise);
                        }
                    )
                );
                this.checkedExercises = [];
            })
            .onDeny(() => {
                this.checkedExercises = [];
            });
    }
    /** Метод обрабатывает выбор упражнения */
    checkExercise(exerciseId: number) {
        let isExists = false;
        const oldCheckedExercises: Exercise [] = this.checkedExercises;
        const tmpCheckedExercises: Exercise [] = [];
        this.checkedExercises = [];
        if (oldCheckedExercises && oldCheckedExercises.length) {
            oldCheckedExercises.forEach((item: Exercise) => {
                if (item.id === exerciseId) {
                    isExists = true;
                    return;
                }
                tmpCheckedExercises.push(item);
            });
        }
        if (!isExists) {
            tmpCheckedExercises.push(<Exercise> this.exerciseList.find(exerciseItem => exerciseItem.id === exerciseId));
        }
        this.checkedExercises = [...<Exercise []>tmpCheckedExercises];
    }
    /** Метод управляет модальным окном для удаления тренировки */
    deleteTraining() {
        const config = new TemplateModalConfig<IDeleteTrainingContext, any, any>(this.deleteTrainingModal);
        config.context = {
            deleteTrainingPromptMessage: `${this._commonLabels.TR_DELETE_TRAINING_QUESTION} '${this.training.name}'?`
        };
        this.modalService
            .open(config)
            .onApprove(() => {
                /* Выполняем операцию через связывающий сервис */
                this.shareService.deleteTrainingData(this.imTraining);
                this.messageService.sendSuccessMessage(
                    `${this._actionLabels.SUCCESSFULL_DELETE_TRAINING}. ${this._actionLabels.PLEASE_SAVE_RESULT_AFTER_EDIT}`
                );
            })
            .onDeny(() => {});
    }
    /** Метод обрабатывает удаление упражнения из тренировки */
    deleteExerciseFromTraining(exercise: IImmutableTrainingExerciseModel) {
        const config = new TemplateModalConfig<IDeleteExerciseContext>(this.deleteExerciseModal);
        config.context = {
            deleteExercisePromptMessage: `${this._commonLabels.TR_DELETE_EXERCISE_QUESTION} '${exercise.get('exerciseName')}'`
        };
        this.modalService
            .open(config)
            .onApprove(() => {
                this.shareService.updateTrainingData(
                    <IImmutableTrainingModel>this.imTraining.update('exercises', exercises => {
                        return <IImmutableBaseList<IImmutableTrainingExerciseModel>>this.trainingService.deleteExercise(
                            this.newExercise,
                            this.oldExercise,
                            exercise.get('uniqueId'),
                            (exerciseIndex: number) => {
                                this.shareService.deletePersistantExercise(
                                    this.oldExercise.get(exerciseIndex)
                                );
                            }
                        );
                    })
                );
                this.messageService.sendSuccessMessage(
                    `${this._actionLabels.SUCCESSFULL_DELETE_EXERCISE}.  ${this._actionLabels.PLEASE_SAVE_RESULT_AFTER_EDIT}`
                );
            })
            .onDeny(() => {});
    }
    /** Метод обрабатывает изменение упражнения в тренировке */
    changeExercise(exercise: IImmutableTrainingExerciseModel, total?: boolean) {
        if (exercise.get('trainingId') !== this.imTraining.get('id')) { return; }
        const updatedTraining = <IImmutableTrainingModel> this.imTraining.update('exercises', exercises => {
            return this.trainingService.updateExercise(exercises, exercise);
        });
        if (!total) {
            this.shareService.updateTrainingData(updatedTraining);
            return;
        }
        this.imTraining = updatedTraining;
        this.detectorRef.detectChanges();
    }
    /** Helpers */
    log(message: any, category?: string ) {
        if (category) {
            this.loger.log(message, category);
        }
        this.loger.log(message);
    }
    changeState(callback: Function | Function [] | Array<[Function, any]>, args?: any);
    changeState(callback: Function | Function[], args?: any) {
        function runSingleCallback (innerCallback: Function, innerArgs?: any) {
            if (innerArgs !== undefined) {
                innerCallback(innerArgs);
            } else {
                innerCallback();
            }
        }
        if (Array.isArray(callback)) {
            callback.forEach(callable => {
                if (Array.isArray(callable)) {
                    runSingleCallback(callable[0], callable[1]);
                    return;
                }
                runSingleCallback(callable);
            });
        } else {
            runSingleCallback(callback, args);
        }
        this.detectorRef.detectChanges();
    }
    /** Overwrited methods */
    errorMessage(message: string) {
        const config = new TemplateModalConfig <IErrorContext> (this.errorModal);
        config.context = {
            message
        };
        this.modalService.open(config)
            .onDeny(() => {});
    }
    exerciseTracker(index: number, item: TrainingExerciseModel) {
        return item.uniqueId;
    }
}
