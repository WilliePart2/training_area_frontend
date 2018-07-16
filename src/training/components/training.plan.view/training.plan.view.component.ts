import { Component, OnInit, OnChanges, ViewChild, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SuiModalService, TemplateModalConfig, ModalTemplate} from 'ng2-semantic-ui';
import { TrainingPlanService } from '../../services/training.plan.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { PadawanService } from '../../../mentor/services/padawan.service';

import { MicrocicleModel } from '../../models/microcicle.model';
import { ExerciseModel } from '../../models/exercise.model';
import { LayoutExerciseModel } from '../../models/layout.exercise.model';
import { AnaliticService } from '../../services/analitic.service';
import { MicrocicleService } from '../../services/microcicle.service';
import { BasePlanItemModel } from '../../models/base.plan.item.model';
import { TrainingModel } from '../../models/training.model';
import { TrainingExerciseModel } from '../../models/training.exercise.model';
import { Exercise } from '../../models/layout.exercise.model';
import { EditExerciseModel } from '../../models/edit.exercise.model';
import { TrainingPlanChartService } from '../../../chart/services/training.plan.chart.service';
import {UsersPlanDataModel} from '../../models/users.plan.data.model';
import {LogService} from '../../../common/log.service';
import { Observable } from 'rxjs/Observable';
import { LabelService } from '../../../common/label.service';
import { TotalMessageService } from '../../../for.all.users/services/total.message.service';

import { IPadawanListModel } from '../../../mentor/models/padawan.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { TrainingActionLabels } from '../../../common/models/training.action.labels';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { TrainingMessageLabels } from '../../../common/models/training.message.labels';


/** Интерфейс типизирующий даные модального окна */
export interface AccessedExercises {
    exercises: ExerciseModel [];
    groups: ExerciseModel [];
    checkedExercises: EditExerciseModel [];
}

export interface IOwnLearners {
    learners: IPadawanListModel;
}

@Component({
    selector: 'training-plan-view',
    templateUrl: './training.plan.view.component.html',
    styleUrls: ['./training.plan.view.component.css'],
    providers: [AnaliticService, PadawanService]
})

export class TrainingPlanViewComponent extends ProtectedComponent implements OnInit, OnChanges {
    _hasInit = false;
    /** Данные о тренировочном плане */
    @Input() planId: number;
    @Input() trainingSessionId: string;
    @Input() modeFromOutside: 'view' | 'edit' | 'own' | 'complete' | 'process';
    @Input() completedExercisePlans: UsersPlanDataModel []; /** Масив раскладок выполненых пользователем */
    @Input() completedTrainings: any [];
    @Input() completedMicrocicles: any [];

    id: number;
    items: MicrocicleModel [] = []; // Сделать копию хранилища для проверки
    name: string;
    category: string;
    visible: string;
    mentorId: number;
    readme: string;
    mode: 'view' | 'edit' | 'own' | 'complete' | 'process' = 'view';
    isOwner: boolean;

    /** Свойства для сохранения копии полученных данных с сервера */
    private _oldItems: string; // Копия которая не будет изменяться
    private _oldItemsInit = false;
    set oldItems(items: MicrocicleModel []) {
        if (!this._oldItemsInit) {
            this._oldItems = JSON.stringify(items);
        }
        this._oldItemsInit = true;
    }
    get oldItems() {
        return [...JSON.parse(this._oldItems)];
    }

    /** Данные для режима редактирования */
    exerciseList: LayoutExerciseModel [] = []; /** Хранилище для упражнений шаблона */
    checkedLayoutExercises = []; /** Флаги для упражнений шаблона которые будут отображены в графике */
    visibleExerciseList: LayoutExerciseModel [] = []; /** Список упражнений составленый на основе флагов */

    microcicleName: string;
    newMicrocicles: MicrocicleModel [] = []; // Добавленые микроциклы
    deletingMicrocicles: MicrocicleModel [] = [];

    /** Данные о пользователе */
    userId: number;

    visibleStore = []; /** В этом свойстве будут храниться флаги видимости микроциклов */

    _globalErrorMessage = 'Ошибка соединения с сервером даные не загружены';

    /** Свойства модального окна */
    @ViewChild('addExerciseToLayout') addExerciseTemplate: ModalTemplate <AccessedExercises, any, any>;
    _listingAccessedExercises: ExerciseModel [] = [];
    set listingAccessedExercises(items: ExerciseModel []) {
        this._listingAccessedExercises = items;
    }
    get listingAccessedExercises() {
        if (this.groupIdForFiltering) {
            return this._listingAccessedExercises.filter(item => item.groupId === this.groupIdForFiltering);
        }
        return this._listingAccessedExercises;
    }
    listingExerciseForRender: ExerciseModel [] = []; /** Список упражнений для отображения в модальном окне */
    listingExerciseGroup: ExerciseModel [];
    groupIdForFiltering = 0; /** id целевой группы по которому фильтруеться список упражнений */
    newCheckedExercises: EditExerciseModel [] = []; /** Хранилише упражнений которые были добавлены пользователем */
    oldCheckedExercises: EditExerciseModel [] = []; /** Хранилище упражнений которые пришли с сервера */
    /** Сериализуемое хранилище данных полученый с сервера(нужно для выявления изменений) */
    private _exerciseFetchedFromServer: string;
    set exerciseFetchedFromServer(items: EditExerciseModel []) {
        this._exerciseFetchedFromServer = JSON.stringify(items);
    }
    get exerciseFetchedFromServer() {
        return JSON.parse(this._exerciseFetchedFromServer);
    }
    /** Свойства для редактирования шаблона упражнений */
    checkedExercises: EditExerciseModel [] = [];
    deletingLayoutExercises: LayoutExerciseModel [] = [];
    /** Свойство хранящее выбраное упражнение */
    selectedExercise: EditExerciseModel;
    /** Свойства для отображения ошибок в модальном окне */
    hasModalError = false;
    modalErrorMessage = '';

    /** свойства для прикрепления тренировочного плана к ученику */
    @ViewChild('appointModal') appointModal: ModalTemplate<IOwnLearners, any, any>;
    appointModalDimmer: boolean;
    appointDimmerMessage: string;

    _commonLabels: TrainingCommonLabels;
    _actionLabels: TrainingActionLabels;
    _messageLabels: TrainingMessageLabels;
    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    layoutModalDimmer: boolean;
    layoutModalDimmerMessage: string;
    hasLayoutModalError: boolean;
    layoutModalErrorMessage: string;

    hasGlobalModalError: boolean;
    globalModalErrorMessage: string;

    hasAppointModalError: boolean;
    appointModalErrorMessage: string;

    constructor(
        protected userManager: UserManagerService,
        private route: ActivatedRoute,
        private router: Router,
        private planService: TrainingPlanService,
        private analitic: AnaliticService,
        private microcicleSerivice: MicrocicleService,
        private modalService: SuiModalService,
        private chartService: TrainingPlanChartService,
        private padawanService: PadawanService,
        private loger: LogService,
        private labelService: LabelService,
        private messageService: TotalMessageService
    ) {
        super(userManager);
    }

    ngOnChanges() {
        this.getId().subscribe();
        if (this.modeFromOutside) {
            this.mode = this.modeFromOutside;
        }
        this.userId = this.userManager.id;
    }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._actionLabels = labels[LABEL_GROUP_NAMES.TRAINING_ACTION_LABLES];
        this._messageLabels = labels[LABEL_GROUP_NAMES.TRAINING_MESSAGE_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.enableDimmer(this._dimmerLabels.TP_STD_DIMMER);
        this.getId()
            /** Загружаем базовые данные о тренировочном палане */
            .flatMap(() => this.initialize())
            /** Загружаем шаблон упражнений для тренировочного плана */
            .flatMap(() => this.loadLayoutExercise())
            .flatMap(() => this.loadAccessedExercises())
            .subscribe(() => {
                this.userId = this.userManager.id;
                this.isOwner = this.userId === this.mentorId;
                this.disableDimmer();
            }, error => {
                this.disableDimmer();
            });
    }
    getId() {
        return Observable.create(observer => {
            if (this.id) {
                observer.next();
                observer.complete();
            }
            this.route.queryParams.subscribe(params => {
                if (params && params.id) {
                    this.id = params.id;
                    observer.next();
                    observer.complete();
                } else {
                    if (this.planId) {
                        this.id = this.planId;
                        observer.next();
                        observer.complete();
                    }
                }
            });
        });
    }

    initialize() {
        return Observable.create(observer => {
            /** Загружаем данные о тренировочном плане */
            this.planService.loadTrainingPlanData(this.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.initializeHandler(resp);
                    observer.next();
                    observer.complete();
                });
            }, error => {
                this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                this.disableDimmer();
                observer.error();
            });
        });
    }
    initializeHandler(response) {
        response = response['data'];
        this.items = [...response['data']];
        this.oldItems = [...response['data']];
        this.id = response['id'];
        this.name = response['name'];
        this.category = response['category'];
        this.visible = response['visible'];
        this.mentorId = parseInt(response['mentorId'], 10);
        this.readme = response['readme'];

        for (let i = 0; i < this.items.length; i++) {
            this.visibleStore[i] = false;
        }

        this._hasInit = true;
    }
    /** Загружаем шаблон упражнения для тренировочного плана */
    loadLayoutExercise() {
        this.disableLayoutModalError();
        return Observable.create(observer => {
            this.planService.loadBaseLayout(this.id).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.loadLayoutExerciseHandler(resp);
                    observer.next();
                    observer.complete();
                });
            }, error => {
                this.enableLayoutModalError(this._errorLabels.STD_HTTP_LOAD_ERROR);
                this.disableDimmer();
            });
        });
    }
    loadLayoutExerciseHandler(response) {
        /* Сохраняем упражнения входящие в шаблон тренировочного плана */
        this.exerciseList = response['data'];
        /* Преобразуем данные в доступный для редактирования вид (записываем в хранилище упражнений полученых с сервера) */
        const fetchedExercises = this.exerciseList.map(item => {
            return {
                id: item.exercise.id, /** id тренировочного упражнения */
                name: item.exercise.name,
                uniqueId: this.generateId(),
                oneRepeatMaximum: item.oneRepeatMaximum,
                group: item.exercise.group
            };
        });
        this.oldCheckedExercises = fetchedExercises;
        this.checkedExercises = [...this.oldCheckedExercises, ...this.newCheckedExercises];
        /** Сохраняем данные для будущего сравнения */
        this.exerciseFetchedFromServer = fetchedExercises;

        /** Иницыализируем свойства графика */
        this.checkedLayoutExercises = this.chartService.createFlagArray(this.exerciseList.length, true);
        this.visibleExerciseList = this.mapFlagToExercises();
    }

    /** Добавляет микроцикл */
    addMicrocicle() {
        if (!this.isOwner) { return; }
        /** Добавляем микроцыкл в список новых item'ов */
        this.newMicrocicles = [...this.newMicrocicles, {
            microcicleId: Date.now(),
            microcicleName: this.microcicleName,
            trainingData: []
        }];
        /** Соединяем микроцыклы полученые с сервера с новыми микроцыклами */
        this.items = this.microcicleSerivice.mergeStores([...this.items, ...this.newMicrocicles], 'microcicleId');
        this.microcicleName = ' ';
    }

    /* сохраняет микроцикл после редактирования */
    microcicleChange(microcicle: MicrocicleModel) {
        let tmpObj: {items: MicrocicleModel [], newMicrocicles: MicrocicleModel []};
        tmpObj = this.microcicleSerivice.saveMicrocicleInPersistantStorage(
            this.items,
            this.newMicrocicles,
            microcicle
        );
        this.items = tmpObj.items;
        this.newMicrocicles = tmpObj.newMicrocicles;
    }

    deleteMicrocicleHandler(id: number) {
        /** Обрабатываем временное хранилище */
        const tmpMicrocicle = this.newMicrocicles.find(mItem => mItem.microcicleId === id);
        if (tmpMicrocicle) {
            this.newMicrocicles = this.newMicrocicles.filter(tmItem => tmItem.microcicleId !== id);
        } else {
            /** Вносим запись в хранилише удаляемых микроциклов */
            this.deletingMicrocicles = [
                ...this.deletingMicrocicles,
                this.items.find(dMicrocicle => dMicrocicle.microcicleId === id)
            ];
        }
        const tmpStore = this.items.filter(pmItem => pmItem.microcicleId !== id);
        this.items = [...tmpStore, ...this.newMicrocicles];
        this.visibleStore = this.visibleStore.map(() => false);
    }

    /** Работа с шаблоном тренировочных упражнений */
    deleteExerciseFromLayout(data: LayoutExerciseModel [], callback: any) {
        this.planService.deleteExerciseFromBaseLayout(this.id, data).subscribe(response => {
            this.checkResponse(response, resp => {
                callback();
            });
        }, error => {
            this.errorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
        });
    }

    addindExerciseToLayout(approve: any) {
        this.enableLayoutModalDimmer(this._dimmerLabels.STD_DIMMER_HTTP_LOAD_MSG);
        this.disableLayoutModalError();
        /** Обрабатываем добавление новых упражнений */
        const items = this.analitic.compareLayout(this.exerciseFetchedFromServer, this.checkedExercises);
        this.planService.addExerciseToBaseLayout(
            this.id, items
        ).subscribe(response => {
            this.checkResponse(response, resp => {
                /** Обнуляем временные данные */
                this.newCheckedExercises = [];
                /** Сохраняем данные в полученые с сервера */
                this.exerciseList = this.microcicleSerivice.mergeStores([
                    ...this.exerciseList.map(exItem => {
                        const respItem = resp['data'].find(item => item.id === exItem.id);
                        if (respItem) {
                            return respItem;
                        }
                        return exItem;
                    }),
                    ...resp['data']
                ]);
                this.oldCheckedExercises = this.exerciseList.map(item => {
                    return {
                        id: item.exercise.id,
                        uniqueId: this.generateId(),
                        name: item.exercise.name,
                        oneRepeatMaximum: item.oneRepeatMaximum,
                        group: item.exercise.group
                    };
                });
                this.checkedExercises = [...this.oldCheckedExercises, ...this.newCheckedExercises];
                this.exerciseFetchedFromServer = [...this.oldCheckedExercises];
                /** Выполняем подтверждающий callback */
                approve();
            });
            this.disableLayoutModalDimmer();
        }, error => {
            this.enableLayoutModalError(this._errorLabels.STD_HTTP_SEND_ERROR);
            this.disableLayoutModalDimmer();
        });
        /** Обрабатываем удаление упражнений */
        if (this.deletingLayoutExercises.length) {
            this.deleteExerciseFromLayout(this.deletingLayoutExercises, approve);
        }
    }
    /** Метод открывает модальное окно для редактирования шаблона упражнений */
    editExerciseLayout() {
        const config = new TemplateModalConfig <AccessedExercises, any, any> (this.addExerciseTemplate);

        config.context = {
            exercises: this.listingExerciseForRender,
            groups: this.listingExerciseGroup,
            checkedExercises: this.checkedExercises
        };

        this.modalService
            .open(config)
            .onApprove(response => {})
            .onDeny(reject => {
                this.newCheckedExercises = [];
                this.checkedExercises = [...this.oldCheckedExercises, ...this.newCheckedExercises];
                this.disableLayoutModalError();
                this.disableLayoutModalDimmer();
            });
    }
    /** Загружает список упражнений в системе */
    loadAccessedExercises() {
        return Observable.create(observer => {
            this.planService.loadExerciseList().subscribe(response => {
                this.checkResponse(response, resp => {
                    this.loadAccessedExerciseHandler(resp);
                    observer.next();
                    observer.complete();
                });
            }, error => {
                this.errorMessage(this._errorLabels.STD_HTTP_LOAD_ERROR);
                this.disableDimmer();
            });
        });
    }
    loadAccessedExerciseHandler(response) {
        this.listingAccessedExercises = [...response['data']];
        this.listingExerciseGroup = [...response['data']];
        this.listingExerciseForRender = this.listingAccessedExercises;
    }
    /** Методы работы с модальным окном для добавления упражнений в шаблон */
    checkExercise(id: number) {
        const addedExercise = this.listingAccessedExercises.find((item: ExerciseModel) => item.id === id);
        if (addedExercise) {
            this.selectedExercise = {
                id: addedExercise.id, /** id Обычного упражнения */
                name: addedExercise.name,
                uniqueId: this.generateId(),
                oneRepeatMaximum: 0,
                group: addedExercise.group
            };
        }
    }
    checkGroupExercise(id: number) {
        this.groupIdForFiltering = id;
        this.listingExerciseForRender = this.listingAccessedExercises;
    }
    addExercise() {
        if (this.selectedExercise) {
            this.disableLayoutModalError();
            /** Проверить есть ли уже такое упражнение */
            const hasExists = this.checkedExercises.find(item => item.id === this.selectedExercise.id);
            if (!hasExists) {
                /** Добавляем упражнение в список выбраных */
                this.newCheckedExercises = [...this.newCheckedExercises, this.selectedExercise];
                /** Соединяем старое и новое хранилище */
                this.checkedExercises = [...this.oldCheckedExercises, ...this.newCheckedExercises];
                this.selectedExercise = null;
                this.resetModalError();
            } else {
                this.enableLayoutModalError(this._errorLabels.EXERCISE_ALREADY_EXISTS_IN_LAYOUT);
            }
        }
    }
    deleteExercise(id: number) {
        // удаление упражнения из хранилища новых элементов
        const dExercise = this.newCheckedExercises.find(item => item.id === id);
        if (dExercise) {
            this.newCheckedExercises = this.newCheckedExercises.filter(item => item.id !== id);
        } else {
            // удаление упражнения из хранилища старых элементов(полученых с сервера)
            this.oldCheckedExercises = this.oldCheckedExercises.filter(item => item.id !== id);
            this.deletingLayoutExercises = [
                ...this.deletingLayoutExercises,
                this.exerciseList.find((item: LayoutExerciseModel) => item.exercise.id === id)
            ];
        }
        this.checkedExercises = [...this.oldCheckedExercises, ...this.newCheckedExercises];
    }
    /** Управление отображеннием упражнений на графике */
    toggleLayoutExerciseVisible(event: MouseEvent, exerciseIndex: number, flag: boolean) {
        event.preventDefault();
        this.visibleExerciseList = this.mapFlagToExercises();
    }
    /** Метод добавляет упражнения шаблона в масив отображения ориентируясь по флагам */
    mapFlagToExercises() {
        let tmpExercises = [];
        this.checkedLayoutExercises.forEach((flagItem: boolean, index: number) => {
            if (flagItem) {
                tmpExercises = [...tmpExercises, this.exerciseList[index]];
            }
        });
        return tmpExercises;
    }

    /** Метод назначает тренировочный план как собственный план для тренировок */
    beginTraining(id: number) {
        this.planService.setTrainingPlanAsCurrent(id).subscribe(response => {
            this.checkResponse(response, resp => {
                if (this.userManager.type = 'mentor') {
                    this.userManager.redirectUser('mentor/training/current-plan');
                } else {
                    this.userManager.redirectUser('user/training/current-plan');
                }
            });
        }, error => {
            this.globalErrorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
        });
    }

    /** Метод открывает модальное окно с собственными учениками которым можно назначить тренировочный план */
    appointToLearner(id: number) {
        /** Загрузить список учеников ( + обработать ситуацию отсутствия учеников) */
        this.padawanService.getOwnPadawanList(this.offset, this.limit).subscribe(response => {
            console.log(response);
            this.checkResponse(response, resp => {
                const config = new TemplateModalConfig<IOwnLearners, any, any> (this.appointModal);
                config.context = {
                    learners: <IPadawanListModel>resp['padawans']
                };
                this.modalService.open(config)
                    .onApprove((...args) => {
                        this.sendRequestToAppoint(args[0], args[1]); /** wtf... */
                    })
                    .onDeny(() => {});
            });
            if (!response || !response.result) {
                this.enableGlobalErrorModal(this._errorLabels.STD_HTTP_LOAD_ERROR);
            }
        }, error => {
            console.log(error);
            this.enableGlobalErrorModal(this._errorLabels.STD_HTTP_LOAD_ERROR);
        });
        /** Обработать назначение тренировочного плана ученику */
    }
    sendRequestToAppoint(padawanId: number, callback: Function) {
        this.appointModalDimmer = true;
        this.appointDimmerMessage = this._dimmerLabels.SENDING_REQUEST;
        this.padawanService.appointTrainingPlanToPadawan(padawanId, this.id).subscribe(response => {
            this.checkResponse(response, resp => {
                callback();
                this.appointModalDimmer = false;
                this.resetModalError();
                this.messageService.sendSuccessMessage(this._actionLabels.SUCCESS_APPIONTING_TRAINING_PLAN_TO_USER);
            });
        }, error => {
            // callback();
            this.enableAppointModalError(this._errorLabels.STD_HTTP_SEND_ERROR);
            this.appointModalDimmer = false;
        });
    }
    /** посмотреть тренировочный план пользователя как его наставник */
    viewUserTrainingPlanAsMentor(trainingPlanId: number, padawanId: number, callback: Function, sessionId?: string) {
        const queryParams = {
            id: trainingPlanId,
            pId: padawanId
        };
        if (sessionId) {
            queryParams['sessionId'] = sessionId;
        }
        /** Просмотр тренировочного плана пользователя выполняеться в отдельном компоненте */
        this.userManager.redirectUser('mentor/training/padawan-training-plan-view', queryParams);
        callback();
    }

    /** Метод отмечает тренировчный план как пройденый */
    setAsCompleted(id: number) {
        this.planService.setTrainingPlanAsComplete(this.id, this.trainingSessionId).subscribe(response => {
            this.checkResponse(response, resp => {
                if (this.userManager.type === 'mentor') {
                    this.userManager.redirectUser('/mentor/training/completed-plans');
                } else {
                    this.userManager.redirectUser('/user/training/completed-plans');
                }
            });
        }, error => {
            this.globalErrorMessage(this._errorLabels.STD_HTTP_SEND_ERROR);
        });
    }

    /**
     * methods for managing dimmer inside add exercise to layout modal
     * @param msg - messahe which will be displayed to user
     */
    enableLayoutModalDimmer(msg?: string) {
        this.layoutModalDimmerMessage = msg || '';
        this.layoutModalDimmer = true;
    }
    disableLayoutModalDimmer() {
        this.layoutModalDimmer = false;
        this.layoutModalDimmerMessage = '';
    }
    /**
     * methods for showing error in add exercise to layout modal
     */
    enableLayoutModalError(msg?: string) {
        this.layoutModalErrorMessage = msg || '';
        this.hasLayoutModalError = true;
    }
    disableLayoutModalError() {
        this.hasLayoutModalError = false;
        this.layoutModalErrorMessage = '';
    }
    /**
     * methods for global error modal
     */
    enableGlobalErrorModal(msg?: string) {
        this.globalModalErrorMessage = msg || '';
        this.hasGlobalModalError = true;
    }
    disableGlobalModalError() {
        this.hasGlobalModalError = false;
        this.globalModalErrorMessage = '';
    }
    enableAppointModalError(msg?: string) {
        this.hasAppointModalError = true;
        this.appointModalErrorMessage = msg || '';
    }
    disableAppointModalError() {
        this.hasAppointModalError = false;
        this.appointModalErrorMessage = '';
    }
    /** Хэлперы */
    microcicleTracker(index: number, item: MicrocicleModel) {
        return item.microcicleId;
    }
    checkOwner() {
        return this.userId === this.mentorId;
    }
    generateId() {
        return `${Date.now()}_${Math.random()}_${Math.random()}`;
    }
    modalError(message: string) {
        this.hasModalError = true;
        this.modalErrorMessage = message;
    }
    resetModalError() {
        this.hasModalError = false;
        this.modalErrorMessage = '';
    }
}

/**
 * Входные данные:
 * Упражнения входящие в шаблон микроцикла
 * Данные входищие в состав макроцикла:
 * - id
 * - name
 * - mentor_id
 * - visible
 * - category
 * - readme
 */
