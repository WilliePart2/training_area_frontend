import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    SimpleChanges,
    trigger,
    state,
    style,
    animate,
    transition
} from '@angular/core';
import * as Immutable from 'immutable';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { MakeTrainingService } from '../../services/make.training.service';

import { BindTrainingService } from '../../services/bind.training.service';
import { BurdenCalcService } from '../../services/burden.calc.service';
import { ExerciseService } from '../../services/exercise.service';
import { LogService } from '../../../common/log.service';
import { LabelService } from '../../../common/label.service';

import { TrainingExerciseModel } from '../../models/training.exercise.model';
import { BasePlanItemModel } from '../../models/base.plan.item.model';

import { IImmutableTrainingExerciseModel } from '../../models/training.exercise.model';

import * as actions from '../../actions/actions.type';
import { IPlanForPerformMutableModel } from '../../models/plan.for.perform.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { TrainingCommonLabels } from '../../../common/models/training.common.labels';
import { ENTrainingExerciseCommands } from '../../models/training.exercise.commands.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';

export interface IDelete {
    exerciseName: string;
    exerciseUniqueId: string;
}

@Component({
    selector: '[exercise-item]',
    templateUrl: './exercise.item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('iconAnimations', [
            state('void => *', style({'opacity': 1})),
            transition('void => *', [
                style({'opacity': 0}),
                animate('300ms', style({'opacity': 1}))
            ])
        ])
    ]
})

export class ExerciseItemComponent extends ProtectedComponent implements OnChanges, OnInit, OnDestroy {
    hoverOnPlanPart: Array<Array<boolean>>;
    editCompletePlanPart: Array<Array<boolean>>;
    isInitialize: boolean;
    isCompleted: boolean;
    isExerciseHovered: boolean;
    @Input('isTrainingBegin') isTrainingBegin: boolean;
    @Input('isHanding') isHanding: boolean;
    @Input('isEditable') isEditable: boolean;
    @Input() mode: 'view' | 'edit' | 'own' | 'complete' | 'process';
    @Input() index: number;
    _item: TrainingExerciseModel;
    _immutableItem: IImmutableTrainingExerciseModel;
    @Input('exercise-item') set item(val: TrainingExerciseModel) {
        this._item = val;
        this._immutableItem = Immutable.fromJS(val);
    }
    get item() { return <TrainingExerciseModel> this._item; }
    set imItem(val: IImmutableTrainingExerciseModel) {
        this._immutableItem = val;
        this._item = val.toJS(); /* need test */
    }
    get imItem() { return this._immutableItem; }
    @Input('connectWithTraining') connectWithTraining: Observable<any>;
    subscribeOnTraining: Subscription;
    /* Свойство указывает на каком элементе сохранять фокус при перерендере */
    focusOnItem: {prop: string, index: number};
    oldPlans: BasePlanItemModel [] = [];
    newPlans: BasePlanItemModel [] = [];
    oldItem: TrainingExerciseModel; /** Храниться предыдущий экзэмпляр полученого упражнения (нужно для сравнения) */
    style = {
        height: '30px',
        paddingTop: '5px'
    };
    /* Свойсва для работы наблюдателя(пока что не используються) */
    observer: Observer<any>;
    subscribe: Subscription;
    hasChanges: boolean;

    _commonLabels: TrainingCommonLabels;
    _errorLabels: ErrorLabelsModel;

    constructor(
        private shareService: BindTrainingService,
        private calcService: BurdenCalcService,
        private exerciseService: ExerciseService,
        private loger: LogService,
        private cdr: ChangeDetectorRef,
        private makeService: MakeTrainingService,
        protected userService: UserManagerService,
        private labelService: LabelService
    ) {
        super(userService);
        this.isInitialize = false;
    }
    ngOnChanges(changes: SimpleChanges) {
        // if (!this.isInitialize) {
        //     this.oldPlans = [...this.item.plans];
        //     this.isInitialize = true;
        // }
        if ((changes.isTrainingBegin && changes.isTrainingBegin.currentValue !== changes.isTrainingBegin.previousValue &&
                changes.isTrainingBegin.currentValue) ||
            (changes.isEditable && changes.isEditable.currentValue !== changes.isEditable.previousValue && changes.isEditable.currentValue) ||
            (changes.isHanding && changes.isHanding.currentValue !== changes.isHanding.previousValue && changes.isHanding.currentValue)) {
                this.initPlanFlagStorage();
        }
        if (this.mode !== 'edit' && !this.isTrainingBegin && !this.isEditable && !this.isHanding) {
            this.resetFocus();
        }
    }
    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.TRAINING_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.oldPlans = [...this.item.plans];
        this.isInitialize = true;

        this.initPlanFlagStorage(true);

        if (this.connectWithTraining) {
            this.subscribeOnTraining = this.connectWithTraining.subscribe(action => {
                switch (action) {
                    case ENTrainingExerciseCommands.RESET_FOCUS: this.resetFocus(); break;
                    case ENTrainingExerciseCommands.RESET_BOOLEAN_FLAGS: this.initPlanFlagStorage(); break;
                }
            });
        }
    }
    ngOnDestroy() {
        if (this.subscribeOnTraining) { this.subscribeOnTraining.unsubscribe(); }
    }
    /* метод обрабатывает изменения упражнения(полностью синхронизирует данные) */
    changeExercise(updatedExercise: IImmutableTrainingExerciseModel) {
        this.shareService.updateExercise(updatedExercise);
    }
    /* Метод для перерендеривания только самой тренировки без отправки данных выше */
    tmpChangeExercise(updatedExercise: IImmutableTrainingExerciseModel) {
        this.changeExercise(updatedExercise);
    }
    /* метод для ручного сохранения данных */
    /** deprecated */
    saveChanges() {
        if (!this.hasChanges) { return; }
        let totalItem = this.imItem;
        const hasNewPlan = this.exerciseService.checkNewPlan(this.imItem);
        if (hasNewPlan) {
            totalItem = this.addPlan(true);
        }
        if (!totalItem) { return; }
        this.changeExercise(totalItem);
    }
    /** Метод удаляет упражнение */
    deleteExercise() {
        this.shareService.deleteExercise(this.imItem);
    }
    /** Обработка работы с тренировочными планами */
    addPlan(tmp?: boolean) {
        let hasError = false;
        const updatedExercise = <IImmutableTrainingExerciseModel> this.exerciseService.addPlan(
            this.imItem,
            () => {
                this.errorMessage(this._errorLabels.ALL_FIELDS_MUST_BE_SPECIFIED);
                hasError = true;
                this.cdr.detectChanges();
            }
        );
        if (hasError) { return; }
        if (!tmp) {
            this.changeExercise(updatedExercise);
            this.resetErrorMessage();
            return;
        }
        this.resetErrorMessage();
        return updatedExercise;
    }
    deletePlan(index: number) {
        this.changeExercise(
            <IImmutableTrainingExerciseModel> this.exerciseService.deletePlan(this.imItem, index)
        );
    }
    changeWeight(planIndex: number, newWeight: number) {
        this.changeExercise(
            <IImmutableTrainingExerciseModel> this.exerciseService.updatePlanProperty(
                this.imItem,
                planIndex,
                'weight',
                newWeight
            )
        );
    }
    changeRepeats(planIndex: number, newRepeats: number) {
        this.changeExercise(
            <IImmutableTrainingExerciseModel> this.exerciseService.updatePlanProperty(
                this.imItem,
                planIndex,
                'repeats',
                newRepeats
            )
        );
    }
    changeRepeatSection(planIndex: number, newRepeatSection: number) {
        this.changeExercise(
            <IImmutableTrainingExerciseModel> this.exerciseService.updatePlanProperty(
                this.imItem,
                planIndex,
                'repeatSection',
                newRepeatSection
            )
        );
    }
    /* управление фокусом ввода */
    setFocus(prop: string, index: number) {
        this.focusOnItem = {
            prop,
            index
        };
    }
    resetFocus() {
        this.focusOnItem = null;
    }
    /** управление выполнением раскладок */
    initPlanFlagStorage(standard?: boolean) {
        this.hoverOnPlanPart = [];
        this.editCompletePlanPart = [];

        if (!standard) {
            this.imItem.get('plans').forEach(item => {
                this.hoverOnPlanPart.push(
                    this.makeService.createBooleanArray(item.get('dataForPerform').size)
                );
                this.editCompletePlanPart.push(
                    this.makeService.createBooleanArray(item.get('dataForPerform').size)
                );
            });
        } else {
            this.hoverOnPlanPart = this.makeService.createBooleanArray(this.imItem.get('plans').size);
            this.editCompletePlanPart = this.makeService.createBooleanArray(this.imItem.get('plans').size);
        }
    }
    setDoneWeight(weight: number, planPartId: number) {
        this.changeExercise(<IImmutableTrainingExerciseModel>this.makeService.setDoneProperty(
                this.imItem,
                'Weight',
                weight,
                planPartId
            )
        );
    }
    setDoneRepeats(repeats: number, planPartId: number) {
        this.changeExercise(<IImmutableTrainingExerciseModel>this.makeService.setDoneProperty(
                this.imItem,
                'Repeats',
                repeats,
                planPartId
            )
        );
    }
    /** проверяет ход выполнения упражнения на тренировке */
    checkExercisePeforming(manual?: boolean) {
        if (this.makeService.checkExercisePerforming(this.imItem)) {
            this.isCompleted = true;
        }
    }
    completePlanPart(performPlanId: number) {
        this.resetFocus();
        this.changeExercise(<IImmutableTrainingExerciseModel>this.makeService.setPlanPartAsComplete(
                this.imItem,
                performPlanId
            )
        );
        this.initPlanFlagStorage();
        setTimeout(() => { this.checkExercisePeforming(); }, 0);
    }
    editPartPlan(planIndex: number, perfPlanIndex: number) {
        if (!this.editCompletePlanPart) { return; }
        this.editCompletePlanPart[planIndex][perfPlanIndex] = true;
    }
    saveEditResult(performPlanId: number) {
        this.imItem = <IImmutableTrainingExerciseModel>this.makeService.setPlanPartAsComplete(
            this.imItem,
            performPlanId
        );
        this.hasChanges = true;
        this.resetFocus();
        this.initPlanFlagStorage();
        this.cdr.detectChanges();
    }
    setHoverOnPlan(planIndex: number, performPlanIndex: number, flag: boolean) {
        if (this.isHanding) { return; }
        this.hoverOnPlanPart[planIndex][performPlanIndex] = flag;
    }
    /* helpers */
    planTraker(index: number, item: BasePlanItemModel) {
        return item.id;
    }
    makingPlanTracker(index: number, item: IPlanForPerformMutableModel) {
        return item.id;
    }
}
