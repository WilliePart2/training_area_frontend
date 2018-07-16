import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Chart } from 'chart.js';
import { LogService } from '../../../common/log.service';
import { TrainingPlanChartService } from '../../services/training.plan.chart.service';

import { MicrocicleModel } from '../../../training/models/microcicle.model';
import { TrainingExerciseModel } from '../../../training/models/training.exercise.model';
import { TrainingModel } from '../../../training/models/training.model';
import { DatasetModel } from '../../models/dataset.model';

import * as options from '../../options/chart.main.options';

@Component({
    selector: 'training-plan-chart',
    templateUrl: './training.plan.chart.component.html',
    styleUrls: ['./training.plan.chart.component.css']
})

export class TrainingPlanChartComponent implements OnInit {
    hasInit = false;
    _microcicles: MicrocicleModel [];
    @Input() set microcicles(items: MicrocicleModel []) {
        this._microcicles = items;
        if (this.hasInit && this.chart) {
            this.checkedMicrocicles = this.chartService.createFlagArray(items.length, true);
            this.updateRenderingData();
        }
    }
    get microcicles() {
        return this._microcicles;
    }
    @Input() exercises: TrainingExerciseModel [];
    /** Свойства управления акордеонами */
    visibleMicrocicles: any;
    /** свойства управления отображаемыми данными */
    checkedMicrocicles: any;
    checkedTrainings: any;
    pears = [];
    pearsColor = [];
    labels: string [] = [];
    datasetStore: DatasetModel [];
    _characteristic = 'averageInt';
    get characteristic() {
        return this._characteristic;
    }
    set characteristic(value: string) {
        this._characteristic = value;
        this.updateRenderingData();
    }
    /** Свойства управления графиком */
    @ViewChild('trainingChart') chartCanvas: ElementRef;
    chart: any;
    constructor(
        private loger: LogService,
        private chartService: TrainingPlanChartService
    ) {
        this.loger.log(options);
    }
    generateColor() {
        const part = 255 / 10;
        const red = Math.random() * 10;
        const green = Math.random() * 10;
        const blue = Math.random() * 10;
        return `rgb(${Math.round(red * part)}, ${Math.round(green * part)}, ${Math.round(blue * part)})`;
    }
    bindPearToColor() {
        const result = [];
        for (let i = 0; i < this.pears.length; i++) {
            result.push(this.generateColor());
        }
        return result;
    }
    ngOnInit() {
        /** Иницыализация данных */
        if (this.microcicles.length) {
            /** Иницыализируем масив содержащий флаги открытия\закрытия акордеонов микроциклов */
            this.visibleMicrocicles = this.chartService.createFlagArray(this.microcicles.length);
            this.checkedMicrocicles = this.chartService.createFlagArray(this.microcicles.length);
            /** Иницыализируем масив устанавливающий флаги открытия закрытия акордеонов тренировок */
            this.checkedTrainings = [];
            this.microcicles.forEach(microcicleItem => {
                this.checkedTrainings.push(this.chartService.createFlagArray(microcicleItem.trainingData.length));
            });
            /** Обрабатываем случай когда в тренировочном плане один микроцикл */
            if (this.microcicles.length === 1) {
                this.checkedTrainings = [
                    this.chartService.createFlagArray(this.checkedTrainings[0].length, true)
                ];
                this.initializeDataForSingleMicrocicle();
            } else {
                /** Иницыализируем данные микроциклов */
                this.checkedMicrocicles = this.chartService.createFlagArray(this.checkedMicrocicles.length, true);
                this.initializeDatasetStore();
            }
        }

        /** Управление графиком */
        this.chart = this.createChart();

        this.hasInit = true;
    }
    createChart() {
        if (!this.chart) {
            const opt = options.mainOptions();
            const ctx = this.chartCanvas.nativeElement.getContext('2d');
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.labels,
                    datasets: [...this.datasetStore],
                },
                options: {
                    ...opt,
                    fill: false
                }
            });
        }
    }
    updateChart() {
        this.chart.data.labels = this.labels;
        this.chart.data.datasets = this.datasetStore;
        this.chart.update();
    }
    /** Метод иницыализирует хранилище dataset */
    initializeDatasetStore() {
        /** Проверяем есть ли выбраные тренировки */
        let hasCheckedTrainings = false;
        this.checkedTrainings.forEach(mBox => {
            if (hasCheckedTrainings) { return; }
            mBox.forEach(tBox => {
                if (tBox === true) {
                    hasCheckedTrainings = true;
                }
            });
        });
        /** Устанавливает надписи категорий */
        const tmpLabels = [];
        for (let i = 0; i < this.microcicles.length; i++) {
            tmpLabels.push(`Микроцикл ${i + 1}`);
        }
        this.labels = tmpLabels;
        /** Если нету отмеченых тренировочк собираем данные о микроциклах */
        if (!hasCheckedTrainings) {
            this.datasetStore = [{
                label: this.calculateReadableCharacteristicValue(),
                data: this.chartService.initDatasetStoreForMicrocicles(
                    this.checkedMicrocicles,
                    this.microcicles,
                    this.characteristic
                )
            }];
            return;
        }
        /** Собираем данные об отмеченых тренировках */
        this.datasetStore = this.chartService.initDatasetFromPeatItem(
            this.pears,
            this.microcicles,
            this.characteristic
        );
        this.datasetStore.forEach((item, index) => {
            item.label = this.calculateReadableCharacteristicValue();
            item['borderColor'] = this.pearsColor[index];
        });
    }
    initializeDataForSingleMicrocicle(index = 0) {
        const initData = this.chartService.initDatasetStoreForOneMicrocicle(
            this.microcicles[index],
            this.checkedTrainings[index],
            this.characteristic
        );
        this.loger.log(initData, 'Initialization data for single microcicle');
        this.loger.log(this.checkedTrainings);
        this.labels = initData.labels;
        this.datasetStore = [{
            label: this.calculateReadableCharacteristicValue(),
            data: initData.data
        }];
    }
    /** Метод обновляет данные для отображения после действий пользователя */
    updateRenderingData() {
        if (!this.microcicles.length) { return; }
        /** Обрабатываем ситуацию когда в плане один микроцикл */
        if (this.microcicles.length === 1) {
            this.initializeDataForSingleMicrocicle();
            this.updateChart();
            return;
        }
        /** Обрабатываем ситуацию когда в плане один выбраный микроцикл */
        if (this.chartService.countTrueFlags(this.checkedMicrocicles) === 1) {
            const index = this.findCheckedMicrocicle();
            this.initializeDataForSingleMicrocicle(index);
            this.updateChart();
            return;
        }
        this.initializeDatasetStore();
        this.updateChart();
    }
    findCheckedMicrocicle() {
        let index = 0;
        this.checkedMicrocicles.forEach((item, mIndex: number) => {
            if (item === true) { index = mIndex; }
        });
        return index;
    }
    setTrainingFlagOnTrue(index) {
        this.checkedTrainings[index] = this.chartService.createFlagArray(
            this.checkedTrainings[index].length,
            true
        );
    }
    disableCheckedTrainings() {
        this.checkedTrainings = this.checkedTrainings.map(mItem => {
            return this.chartService.createFlagArray(mItem.length, false);
        });
    }
    calculateReadableCharacteristicValue() {
        let characteristic = '';
        switch (this.characteristic) {
            case 'KPSH': characteristic = 'КПШ'; break;
            case 'averageWeight': characteristic = 'Средний вес'; break;
            case 'averageInt': characteristic = 'Средняя интенсивность'; break;
            case 'tonnage': characteristic = 'Тоннаж'; break;
        }
        return characteristic;
    }
    /** Методы управления данными о тренировках */
    createPearData(microcicleIndex: number, trainingIndex: number) {
        return {
            microcicleIndex,
            trainingIndex
        };
    }
    clearPearStore() {
        this.pears = [];
    }
    /** Переключатели для акордеонов */
    toggleMicrocicleVisible(event: any, index: number) {
        if (event.target.getAttribute('data-title') === 'micocicle') {
            if (this.visibleMicrocicles && this.visibleMicrocicles.length) {
                this.visibleMicrocicles[index] = !this.visibleMicrocicles[index];
            }
        }
    }
    /** Методы управления отображением данных */
    toggleMicrocicleDataVisible(event: MouseEvent, microcicleFlag: boolean) {
        event.stopPropagation();
        this.clearPearStore();
        /** Обрабатываем ситуацию когда нужно посмотреть информацию только о микроциклах */
        if (this.chartService.countTrueFlags(this.checkedMicrocicles) !== 1) {
            this.disableCheckedTrainings();
        }
        /** Обрабатываем ситуацию когда нужно посмотреть информацию о конкретном микроцикле */
        if (this.chartService.countTrueFlags(this.checkedMicrocicles) === 1) {
            const index = this.findCheckedMicrocicle();
            this.disableCheckedTrainings();
            this.setTrainingFlagOnTrue(index);
        }
        /** Обрабатываем ситуацию еогда данные выводить не нужно */
        if (this.chartService.countTrueFlags(this.checkedMicrocicles) === 0) {
            this.disableCheckedTrainings();
        }
        this.updateRenderingData();
    }
    toggleTrainingDataVisible(event: MouseEvent, trainingFlag: boolean, microcicleIndex: number, trainingIndex: number) {
        event.stopPropagation();
        /** Обрабатываем созданые данные для отображения графика по тренировкам */
        if (this.chartService.countTrueFlags(this.checkedMicrocicles) === 0) {
            this.loger.log(this.pears, 'Pears store before manipulation');
            if (trainingFlag) {
                /** Определяем индекс масива даннх в хранилище */
                const sugestedPearIndex = this.chartService.countTrueFlags(this.checkedTrainings[microcicleIndex]) - 1;
                /** Обрабатываем ситуацию если хранилище с таким индексом уже создано */
                if (this.pears[sugestedPearIndex]) {
                    let deletedIndex;
                    this.pears.forEach((pearStorage, index) => {
                        if (deletedIndex !== undefined) { return; }
                        if (pearStorage[microcicleIndex] === null) { deletedIndex = index; }
                    });
                    this.loger.log(deletedIndex, 'Deleted index');
                    /** Если в каком то хранилище данные в ячейке с таким индексом были удалены вставляем туда данные */
                    if (deletedIndex !== undefined) {
                        this.pears[deletedIndex][microcicleIndex] = this.createPearData(microcicleIndex, trainingIndex);
                    } else {
                        this.pears[sugestedPearIndex][microcicleIndex] = this.createPearData(microcicleIndex, trainingIndex);
                    }
                } else {
                    this.pearsColor[sugestedPearIndex] = this.generateColor();
                    this.pears[sugestedPearIndex] = this.chartService.createFlagArray(this.microcicles.length);
                    this.pears[sugestedPearIndex][microcicleIndex] = this.createPearData(microcicleIndex, trainingIndex);
                }
                this.pears = [...this.pears];
                this.loger.log(this.pears, 'Pears Storage after manipulation');
            } else {
                /** Обрабатываем удаение данных */
                let newPears = [];
                this.pears.forEach(dataBox => {
                    newPears = [...newPears, dataBox.map(pearItem => {
                        if (pearItem && pearItem.microcicleIndex === microcicleIndex && pearItem.trainingIndex === trainingIndex) {
                            return null;
                        }
                        return pearItem;
                    })];
                });
                this.pears = newPears;
                this.loger.log(this.pears, 'Pears Storage after manipulation');
            }

        }
        this.updateRenderingData();
    }
}
