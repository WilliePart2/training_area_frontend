import {
    Component,
    Input,
    ViewChild,
    Output,
    EventEmitter,
    OnChanges,
    OnInit,
    OnDestroy,
    DoCheck,
    SimpleChanges,
    ChangeDetectorRef,
    ChangeDetectionStrategy
} from '@angular/core';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { take } from 'rxjs/operator/take';
import { UserManagerService } from '../../../common/user.manager.service';
import { BurdenCalcService } from '../../services/burden.calc.service';
import { AfterSaveService } from '../../services/after.save.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { TrainingModel } from '../../models/training.model';
import { TrainingExerciseModel } from '../../models/training.exercise.model';
import { IImmutableTrainingExerciseModel} from '../../models/training.exercise.model';
import { LayoutExerciseModel } from '../../models/layout.exercise.model';
import { LayoutExercise } from '../../models/layout.exercise.model';
import { SuiModalService, TemplateModalConfig, ModalTemplate } from 'ng2-semantic-ui';
import { MicrocicleService } from '../../services/microcicle.service';
import { TrainingService } from '../../services/training.service';
import {BasePlanItemModel} from '../../models/base.plan.item.model';
import {IImmutableBasePlanItemModel} from '../../models/base.plan.item.model';
import {ExerciseModel} from '../../models/exercise.model';
import { ExecuteTrainingService } from '../../services/execute.training.service';
import {LogService} from '../../../common/log.service';
import {UsersPlanDataModel} from '../../models/users.plan.data.model';
import {TrainingPlanService} from '../../services/training.plan.service';
import {IImCompletedMicrocicleModel, IImCompletedTrainingModel} from '../../models/completed.data.models';
import { Exercise } from '../../models/layout.exercise.model';
import {AnaliticService} from '../../services/analitic.service';
import {MicrocicleModel} from '../../models/microcicle.model';
import * as Immutable from 'immutable';
import {IImmutableMicrocicleModel} from '../../models/microcicle.model';
import {IImmutableTrainingModel} from '../../models/training.model';
import {IImmutableBaseList} from '../../models/immutable.base';
import { BindTrainingService } from '../../services/bind.training.service';
import { MakeTrainingService } from '../../services/make.training.service';
import { LabelService } from '../../../common/label.service';
import { TotalMessageService } from '../../../for.all.users/services/total.message.service';

import { IDeleteTrainingResult } from '../../models/microcicle.operations.models';
import { ITrainingPlanUpdateResponse } from '../../models/training.plan.update.response.model';
import { IListPlansForPerformModel } from '../../models/plan.for.perform.model';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { TrainingActionLabels } from '../../../common/models/training.action.labels';
import { TrainingMessageLabels } from '../../../common/models/training.message.labels';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';

import * as actions from '../../actions/actions.type';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';

/** Модель данных для модального окна добавления тренировки */
interface IContext {
    list: LayoutExerciseModel [];
}

/** Модель данных для модального окна добавления упражнения в тренировку */
interface AddExerciseContext {
    list: LayoutExerciseModel [];
    trainingName: string;
    trainingId: number;
}

/* сообщение об удалении микроцыкла */
interface IMicrDelMessage {
    message: string;
}

@Component({
    selector: 'training-microcicle',
    templateUrl: './training.microcicle.component.html',
    styleUrls: ['./training.microcicle.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [BindTrainingService, AfterSaveService, MakeTrainingService]
})

export class TrainingMicrocicleComponent extends ProtectedComponent implements OnChanges, OnInit, OnDestroy {
    /** Свойства управляющие видимостью микроцикла в акордеоне */
    _visible: boolean;
    @Input() set visible(value: boolean) {
        this._visible = value;
        this.visibleChange.emit(value);
    }
    get visible() {
        return this._visible;
    }
    @Output() visibleChange = new EventEmitter();

    isFirstInit: boolean;
    @Input() planId: number; /* stable */
    /* свойства для проверки являеться ли тренировочный план новодобавленым */
    @Input() newAddedMicrocicles: MicrocicleModel [];
    isNewAddedMicrocicle: boolean;
    /* данные о микроцикле */
    @Input() microcicle: MicrocicleModel;
    @Output() microcicleChange = new EventEmitter <MicrocicleModel> (); /* Dont use immutable microcicle model in this place */
    oldMicrocicle: IImmutableMicrocicleModel;
    baseMicrocicle: IImmutableMicrocicleModel;
    _newMicrocicle: IImmutableMicrocicleModel;
    set newMicrocicle(item: IImmutableMicrocicleModel) {
        this._newMicrocicle = item;
        if (item.has('trainingData')) {
            this.trainingData = item.get('trainingData').toJS();
        }
    }
    get newMicrocicle() { return this._newMicrocicle; }

    /** Свойства для получения данных о содержании микроцикла */
    trainingData: TrainingModel [] = [];
    @Output() dataChange = new EventEmitter <TrainingModel []> (); /* deprecated */

    @Input() mode: 'view' | 'edit' | 'own' | 'complete' | 'process';
    @Input() exerciseList: LayoutExerciseModel [] = [];

    /** Свойства для обработки информации тренировочного плана */
    @Input() trainingSessionId: string;
    @Input() usersPlans: IListPlansForPerformModel; /** Тут храняться данные о раскладках выполненых пользователем */
    @Input() completedTrainings: IImmutableBaseList<IImCompletedTrainingModel>;
    @Input() completedMicrocicles: IImmutableBaseList<IImCompletedMicrocicleModel>;
    hasInitUserPlans: boolean;
    isMicrocicleComplete: boolean;

    /** Свойства модального окна */
    @ViewChild('templateModal') modalTemplate: ModalTemplate<IContext, string, string>;
    trainingName: string;
    checkedExercises: Exercise [] = [];
    @ViewChild('addExerciseTemplate') addExerciseTemplate: ModalTemplate<AddExerciseContext, any, any>;
    @ViewChild('deleteMicrocicleModal') deleteMicrocicleTemplate: ModalTemplate<IMicrDelMessage, any, any>;

    /** Свойсвта для манипуляции тренировками */
    newTrainings: IImmutableBaseList<IImmutableTrainingModel>;
    oldTrainings: IImmutableBaseList<IImmutableTrainingModel>;
    trainingSubscription: Subscription;
    /* свойства для временного хранения удаляемых данных */
    deletingPlan: IImmutableBaseList<IImmutableBasePlanItemModel>;
    deletingExercise: IImmutableBaseList<IImmutableTrainingExerciseModel>;
    deletingTraining: IImmutableBaseList<IImmutableTrainingModel>;
    @Output() deletingMicrocicle = new EventEmitter();

    /** property which contained labels */
    _commonLabels: TrainingCommonLabels;
    _actionLabels: TrainingActionLabels;
    _messageLabels: TrainingMessageLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        protected userManager: UserManagerService,
        private modalService: SuiModalService,
        private microcicleService: MicrocicleService,
        private trainingService: TrainingService,
        private execTrService: ExecuteTrainingService,
        private planService: TrainingPlanService,
        private loger: LogService,
        private analiticService: AnaliticService,
        private shareService: BindTrainingService,
        public calcService: BurdenCalcService,
        private cdr: ChangeDetectorRef,
        private saveService: AfterSaveService,
        private makerService: MakeTrainingService,
        private labelService: LabelService,
        private messageService: TotalMessageService,
        private zone: NgZone
    ) {
        super(userManager);
        this.mode = this.mode ? this.mode : 'view';
        this.hasInitUserPlans = false;
        this.isFirstInit = false;
    }

    ngOnInit() {
        this.trainingSubscription = this.shareService.getCore().subscribe(action => {
            switch (action.type) {
                case actions.UPDATE_TRAINING: this.changeTraining(action.data); break;
                case actions.DELETE_TRAINING: this.deleteTraining(action.data); break;
                case actions.DELETE_PERSISTANT_EXERCISE: this.deleteExercise(action.data); break;
                case actions.DELETE_PLAN: this.deletePlan(action.data); break;
            }
        });
        const updateTrainingModel = this.microcicleService.updateOneRepeatMaximum(this.exerciseList, this.microcicle.trainingData);
        /* целесообразность под вопросом */
        this.baseMicrocicle = Immutable.fromJS({
            ...this.microcicle,
            trainingData: <TrainingModel []>updateTrainingModel
        });
        this.newMicrocicle = this.baseMicrocicle;
        this.oldMicrocicle = this.newMicrocicle;
        /* иницыализируем хранилища тренировочных данных */
        this.oldTrainings = this.baseMicrocicle.get('trainingData');
        this.newTrainings = Immutable.List();
        this.isFirstInit = true;
        /* иницыализируем хранилища удаляемых данных */
        this.deletingPlan = Immutable.List();
        this.deletingExercise = Immutable.List();
        this.deletingTraining = Immutable.List();
        /* иницыализируем свойства идентификации микроцыкла как нового */
        this.isNewAddedMicrocicle = this.checkMicrocicleAsNew(this.newAddedMicrocicles, this.microcicle);

        /* блок иницыализаци для режимов own/process/complete */
        this.checkMicrocicle();

        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._actionLabels = labels[LABEL_GROUP_NAMES.TRAINING_ACTION_LABLES];
        this._messageLabels = labels[LABEL_GROUP_NAMES.TRAINING_MESSAGE_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
    }
    ngOnDestroy() {
        this.trainingSubscription.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        // if (!this.visible) { return; }
        if (changes.microcicle &&
            (!changes.microcicle.firstChange ||
                (changes.microcicle.previousValue !== changes.microcicle.currentValue))) {
            /** Сохраняем полученые данные для сравнения */
            if (!this.isFirstInit) { /* обработка данных пришедших от родительского компонента */
                this.baseMicrocicle = Immutable.fromJS(changes.microcicle.currentValue);
                const microcicle: IImmutableMicrocicleModel = this.baseMicrocicle;
                this.oldTrainings = microcicle.has('trainingData') ? microcicle.get('trainingData') : Immutable.List();
                if (this.newTrainings && this.newTrainings.size) {
                    this.newTrainings = this.newTrainings.clear(); /* очищаем что бы не было дублей */
                }
                /** Делаем копию микроцыкла */
                this.newMicrocicle = microcicle; /** Свойство над которым будут выполняться манипуляции */
                this.oldMicrocicle = this.newMicrocicle;
                this.isFirstInit = true;
            }

            if (this.checkMode([
                    'own',
                    'complete',
                    'process'
                ])) {
                this.checkMicrocicle();
            }
        }
        if (changes.exerciseList &&
            !changes.exerciseList.firstChange &&
            (changes.exerciseList.previousValue !== changes.exerciseList.currentValue)) {
                this.oldTrainings = <IImmutableBaseList<IImmutableTrainingModel>>this.oldTrainings.map(tItem => {
                    return Immutable.fromJS(
                        this.microcicleService.updateOneRepeatMaximum(this.exerciseList, tItem.toJS())
                    );
                });
                if (this.newTrainings || this.newTrainings.size) {
                    this.newTrainings = <IImmutableBaseList<IImmutableTrainingModel>>this.newTrainings.map(tItem => {
                        return Immutable.fromJS(
                            this.microcicleService.updateOneRepeatMaximum(this.exerciseList, tItem.toJS())
                        );
                    });
                }
            this.newMicrocicle = <IImmutableMicrocicleModel>this.newMicrocicle.update('trainingData', () => {
                return this.oldTrainings.concat(this.newTrainings);
            });
        }
    }
    /* метод проверяет не являеться ли микроцыкл новодобавленным */
    checkMicrocicleAsNew(newAddedMicrocicles: MicrocicleModel[], ownMicrocicle: MicrocicleModel) {
        if (!newAddedMicrocicles || !newAddedMicrocicles.length) { return false; }
        let result = false;
        newAddedMicrocicles.forEach(item => {
            if (item.microcicleId === ownMicrocicle.microcicleId) { result = true; }
        });
        return result;
    }
    /** метод обрабатывает выполнение тренировки */
    completeTrainingHandler(completeUserPlans: IListPlansForPerformModel, trainingId: number) {
        /** обрабатываем раскладки выполненые пользователем */
        if (!this.usersPlans) {
            this.usersPlans = completeUserPlans;
        } else {
            this.usersPlans = <IListPlansForPerformModel>this.usersPlans.concat(completeUserPlans);
        }
        /** обрабатываем завершенные тренировки */
        this.addItemInCompleteStorage('training', trainingId);
        this.checkMicrocicle();
        this.cdr.detectChanges();
    }
    /** метод обрабатывает изменения результатов выполненой тренировки */
    handlerOfEditiningCompletedTraining(completedPlans: IListPlansForPerformModel) {
        this.usersPlans = this.makerService.mergeCompletedUserPlans(this.usersPlans, completedPlans);
    }

    toggleVisible(event: any) {
        if (<HTMLElement>event.target.getAttribute('data-id')) {
            this.visible = !this.visible;
            this.resetErrorMessage();
        }
    }
    /** Метод переключает режимы редактирования\просмотра */
    toggleMode() {
        this.mode = this.mode === 'edit' ? 'view' : 'edit';
        if (this.mode === 'edit') {
            this.resetErrorMessage();
        }
        if ((this.mode === 'edit' || this.mode === 'view') && this.visible) {
            /* вставляем пустую раскладку для редактирования */
            this.oldTrainings = <IImmutableBaseList<IImmutableTrainingModel>> this.oldTrainings.map(tItem => {
                return tItem.update('exercises', exDataList => {
                    return this.trainingService.prepareData(exDataList, this.mode);
                });
            });
            this.newTrainings = <IImmutableBaseList<IImmutableTrainingModel>> this.newTrainings.map(tItem => {
                return tItem.update('exercises', exDataList => {
                    return this.trainingService.prepareData(exDataList, this.mode);
                });
            });
            this.newMicrocicle = <IImmutableMicrocicleModel>this.newMicrocicle.update('trainingData', tDataList => {
                return this.oldTrainings.concat(this.newTrainings);
            });
        }
    }
    /** Метод иницыализирует сохранение изменений при редактировании */
    initSaveChanges() {
        if (this.mode === 'edit') {
            this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
            this.toggleMode();
            this.saveChangesOnServer();
        }
    }
    saveChangesOnServer() {
      let addingData: MicrocicleModel [];
      if (!this.isNewAddedMicrocicle) {
          addingData = <MicrocicleModel[]>this.analiticService.checkTrainingPlan(
              [this.microcicle],
             [this.newMicrocicle.toJS()]
          );
      } else {
          addingData = [this.newMicrocicle.toJS()];
      }
      this.planService.updateTrainingPlan(
          this.planId,
          addingData,
          {
              microcicles: [],
              trainings: this.deletingTraining ? this.deletingTraining.toJS() : [],
              exercises: this.deletingExercise ? this.deletingExercise.toJS() : [],
              plans: this.deletingPlan ? this.deletingPlan.toJS() : []
          }
      ).subscribe(response => {
          this.checkResponse(response, resp => {
              const data: ITrainingPlanUpdateResponse = Immutable.fromJS(resp.data);
              const tmpMicrocicle: IImmutableMicrocicleModel = this.saveService.updateMicrocicleDataAfterResponse(
                  data,
                  this.newMicrocicle
              );
              this.isFirstInit = false;
              this.microcicleChange.emit(tmpMicrocicle.toJS()); /* Отправляем данные в Parent component */
              this.messageService.sendSuccessMessage(this._actionLabels.MICROCICLE_SUCCESSFUL_EDITED);
          });
          this.disableDimmer();
          this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(() => {
            this.cdr.detectChanges();
          });
      }, error => {
          this.disableDimmer();
          this.errorMessage(this._dimmerLabels.STD_HTTP_DIMMER_ERROR_MSG);
          this.cdr.detectChanges();
      });
    }
    cancelEditing() {
        this.toggleMode();
        this.newMicrocicle = Immutable.fromJS(this.microcicle);
    }

    /** Метод открывает модальное окно */
    /** Метод добавляет тренировку */
    open() {
        const config = new TemplateModalConfig<IContext, string, string>(this.modalTemplate);
        config.context = { list: this.exerciseList.map(item => {
                return {
                    ...item,
                    checked: false
                };
            }) };

        this.modalService
            .open(config)
            .onApprove(result => {
                const training = this.microcicleService.createNewTraining(
                    this.microcicle.microcicleId,
                    this.trainingName,
                    this.checkedExercises
                );
                /** Вносим данные во временное хранилище */
                if (!this.newTrainings) { this.newTrainings = Immutable.List(); }
                this.newTrainings = this.newTrainings.push(Immutable.fromJS(training));

                /** Объединяем данные из временного и постоянного хранилища */
                this.newMicrocicle = <IImmutableMicrocicleModel>this.newMicrocicle.update('trainingData', () => {
                    return this.oldTrainings.concat(this.newTrainings);
                });
                this.cdr.detectChanges();
                /** Очищаем входные данные */
                this.trainingName = ' ';
                this.checkedExercises = [];
            })
            .onDeny(result => {
                this.checkedExercises = [];
                this.trainingName = '';
            });
    }

    /** Метод обрабатывающий выбор упражнения */
    checkExercise(id: number) {
        const checkedExercise = [];
        const oldCheckedExercises = this.checkedExercises;
        this.checkedExercises = [];
        oldCheckedExercises.forEach(item => {
            if (item.id === id) {
                checkedExercise.push(item);
                return;
            }
            this.checkedExercises.push(item);
        });
        const prepareItem = this.exerciseList.find(item => item.id === id);
        if (!checkedExercise.length) { this.checkedExercises.push({
            ...prepareItem,
            checked: false
        }); }
    }

    /** Методы для обработки данных микроцикла (выполнения тренировки и сбора статистики) */

    /** Метод проверяет микроцикл на наличие завершенности */
    checkMicrocicle() {
        if (this.completedMicrocicles && this.completedMicrocicles.size) {
            /** Обрабатываем случай когда сам микроцикл являеться завершенным */
            const isCompleted = this.completedMicrocicles.find(compMicrocicleItem => {
                return compMicrocicleItem.get('id') === this.newMicrocicle.get('microcicleId');
            });
            if (isCompleted) {
                this.setMicrocicleAsComplete();
            }
        }
        /** Обрабатываем случай когда все тренировки микроцыкла являються заврешенными */
        let isAllTrainingCompleted = true;
        if (this.completedTrainings) {
            this.newMicrocicle.get('trainingData').forEach(trainingItem => {
                const completedTrainingItem = this.completedTrainings.find(completedItem => {
                    return trainingItem.get('id') === completedItem.get('id');
                });
                if (completedTrainingItem) { return; }
                isAllTrainingCompleted = false;
            });
        } else {
            isAllTrainingCompleted = false;
        }
        if (isAllTrainingCompleted && !this.isMicrocicleComplete) {
            /** Отправляем данные на сервер */
            this.planService.setMicrocicleAsCompleted(
                this.planId,
                this.newMicrocicle.get('microcicleId'),
                this.trainingSessionId
            ).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.setMicrocicleAsComplete();
                    this.addItemInCompleteStorage('microcicle', this.newMicrocicle.get('microcicleId'));
                    this.messageService.sendSuccessMessage(this._actionLabels.MICROCICLE_SUCCESSFULL_COMPLETED);
                });
            }, error => {
                this.messageService.sendErrorMessage(this._actionLabels.MICROCICLE_COMPLETE_ERROR);
            });
        }
    }
    /** Метод устанавливает микроцыкл как завершенный */
    setMicrocicleAsComplete() {
        this.isMicrocicleComplete = true;
    }
    addItemInCompleteStorage(storage: 'microcicle' | 'training', itemId) {
        let fullNameStorage = '';
        switch (storage) {
            case 'microcicle': fullNameStorage = 'completedMicrocicles'; break;
            case 'training': fullNameStorage = 'completedTrainings'; break;
        }
        if (this[fullNameStorage] !== undefined) {
            const completeItemObj = Immutable.Map({'id': itemId});
            if (this[fullNameStorage].size) {
                this[fullNameStorage] = this[fullNameStorage].push(completeItemObj);
            } else {
                this[fullNameStorage] = Immutable.List.of(completeItemObj);
            }
            this.cdr.detectChanges();
        }
    }

    /** Метод удаляет микроцыкл */
    deleteMicrocicleHandler() {
        const config = new TemplateModalConfig<IMicrDelMessage, any, any> (this.deleteMicrocicleTemplate);
        config.context = {
            message: `${this._actionLabels.DELETE_MICROCICLE_QUESTION} "${this.microcicle.microcicleName}"`
        };
        this.modalService.open(config)
            .onApprove(() => {
                this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
                this.cdr.detectChanges();
                /* Insert here method for deleting microcicle from server */
                this.microcicleService.deleteMicroicleFromServer(this.microcicle.microcicleId)
                    .subscribe(response => {
                        this.checkResponse(response, resp => {
                            this.deletingMicrocicle.emit(this.microcicle.microcicleId);
                            this.messageService.sendSuccessMessage(
                                `${this._actionLabels.MICROCICLE_SUCCESSFULL_DELETE}. ${this._actionLabels.PLEASE_SAVE_RESULT_AFTER_EDIT}`
                            );
                        });
                        this.disableDimmer();
                    }, error => {
                        this.toggleMode();
                        this.errorMessage(this._errorLabels.ERROR_DELETING_MICROCICLE);
                        this.disableDimmer();
                        this.cdr.detectChanges();
                    });
            })
            .onDeny(() => {});
    }

    /** Обработчик изменения тренировки */
    changeTraining(training: IImmutableTrainingModel) {
        if (!this.newMicrocicle) { return; }
        this.newMicrocicle = <IImmutableMicrocicleModel>this.newMicrocicle.update('trainingData', oldData => {
          const result = this.microcicleService.updateTraining(this.oldTrainings, this.newTrainings, training);
          this.oldTrainings = result['updatedOldTrainings'];
          this.newTrainings = result['updatedNewTrainings'];
          return this.oldTrainings.concat(this.newTrainings);
        });
        this.cdr.detectChanges();
    }

    /** Метод удаляет тренировку */
    deleteTraining(training: IImmutableTrainingModel) {
        if (!this.newMicrocicle || !this.newMicrocicle.has('trainingData')) { return; }
        this.newMicrocicle = <IImmutableMicrocicleModel>this.newMicrocicle.update('trainingData', () => {
            const modTrainingData: IDeleteTrainingResult = this.microcicleService.deleteTraining(
                this.oldTrainings,
                this.newTrainings,
                training.get('id'),
                (delTrainingIndex: number) => {
                    this.deletingTraining = this.deletingTraining.push(this.oldMicrocicle.getIn(['trainingData', delTrainingIndex]));
                }
            );
            /** обновляем промежуточные хранилища */
            this.newTrainings = modTrainingData.modNewTrainings;
            this.oldTrainings = modTrainingData.modOldTrainings;
            return this.oldTrainings.concat(this.newTrainings);
        });
        this.cdr.detectChanges();
    }

    /** Метод удаляет упражнение из тренировки (прокидываеться до компонента training-item) */
    deleteExercise(exercise: IImmutableTrainingExerciseModel) {
        if (!this.deletingExercise) {
            this.deletingExercise = Immutable.List(exercise);
            return;
        }
        this.deletingExercise.push(exercise);
    }

    /** Метод удаляет тренировочный план (прокидываеться аж до компонента exercise-item) */
    deletePlan(plan: IImmutableBasePlanItemModel) {
        if (!this.deletingPlan) {
            this.deletingPlan = Immutable.List(plan);
            return;
        }
        this.deletingPlan.push(plan);
    }

    /** Helpers */
    checkMode(availableMods: string []) {
        const isAvailable = availableMods.find(availModItem => availModItem === this.mode);
        return !!isAvailable;
    }
    trainingTracker(index: number, item: TrainingModel) {
        return item.id;
    }
}
