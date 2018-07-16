import { Component, Input, OnInit, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js';
import { LayoutExerciseChartService } from '../../services/layout.exercise.chart.service';
import { LogService } from '../../../common/log.service';

import { LayoutExerciseModel } from '../../../training/models/layout.exercise.model';
import { MicrocicleModel } from '../../../training/models/microcicle.model';
import { DatasetModel } from '../../models/dataset.model';

import * as chartOptions from '../../options/chart.main.options';

@Component({
    selector: 'layout-exercise-chart',
    templateUrl: './training.exercise.chart.component.html',
    styleUrls: ['./training.exercise.chart.component.css']
})

export class TrainingExerciseChartComponent implements OnInit, OnChanges {
    chart: Chart;
    datasets: DatasetModel [];
    datasetsColors: string [];
    labels: string [];
    hasInit = false;
    @Input() trainings: LayoutExerciseModel [];
    @Input() microcicles: MicrocicleModel [];
    @ViewChild('layoutExerciseChart') chartCanvas: ElementRef;
    _characteristic = 'averageInt';
    get characteristic() {
        return this._characteristic;
    }
    set characteristic(item: string) {
        this._characteristic = item;
        if (this.hasInit) {
            this.updateRenderingData();
        }
    }

    constructor(
        private chartService: LayoutExerciseChartService,
        private loger: LogService
    ) {}

    ngOnInit() {
        const updateFlag = this.chart ? true : false;
        this.init(updateFlag);
        this.hasInit = true;
    }
    ngOnChanges() {
        const updateFlag = this.chart ? true : false;
        this.init(updateFlag);
    }
    init(update = false) {
        if ((this.trainings && this.microcicles) && (this.trainings.length && this.microcicles.length)) {
            const datasets = this.chartService.getDatasetData(this.trainings, this.microcicles, this.characteristic);
            const preparedDatasetData = this.initDatasetColorStorage(
                datasets,
                this.datasetsColors
            );
            this.datasets = preparedDatasetData ? preparedDatasetData.datasets : datasets;
            this.datasetsColors = preparedDatasetData ? preparedDatasetData.colorStorage : this.datasetsColors;
            this.labels = this.generateLabels(this.microcicles.length);
            if (!update) {
                this.chart = this.createChart();
            } else {
                this.updateChart(this.chart);
            }
        }
    }
    updateRenderingData() {
        this.init(true);
    }
    createChart() {
        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: this.datasets
            },
            options: chartOptions.mainOptions()
        });
    }
    updateChart(chart: Chart, datasets = [], labels = []) {
        chart.data.datasets = datasets.length ? datasets : this.datasets;
        chart.data.labels = labels.length ? labels : this.labels;
        chart.update();
    }
    generateLabels(length: number) {
        const labels = [];
        for (let i = 0; i < length; i++) {
            labels.push(`Микроцикл ${i + 1}`);
        }
        return labels;
    }
    generateColor() {
        const part = Math.round(255 / 10);
        const red = Math.round(Math.random() * 10);
        const green = Math.round(Math.random() * 10);
        const blue = Math.round(Math.random() * 10);
        return `rgb(${red * part}, ${green * part}, ${blue * part})`;
    }
    initDatasetColorStorage(datasets = [], colorStorage = []) {
        if (!datasets.length && this.datasets) { datasets = this.datasets; }
        if (!colorStorage.length && this.datasetsColors) { colorStorage = this.datasetsColors; }
        if (!datasets.length) { return; }
        datasets.forEach(datasetItem => {
            let colorData = colorStorage.find(colorItem => colorItem.exerciseName === datasetItem.label);
            if (!colorData) {
                colorData = this.createColorItem(datasetItem.label, this.generateColor());
                colorStorage = [...colorStorage, colorData];
            }
            datasetItem.borderColor = colorData.color;
        });
        return {
            datasets,
            colorStorage
        };
    }
    createColorItem(exerciseName: string, color: string) {
        return {
            exerciseName,
            color
        };
    }
    /** Helpers */
    log(message: any, category = '') {
        this.loger.log(message, category);
    }
}
