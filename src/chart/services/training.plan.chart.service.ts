import { Injectable } from '@angular/core';
import * as Immutable from 'immutable';
import { MicrocicleService } from '../../training/services/microcicle.service';
import { LogService } from '../../common/log.service';
import { BurdenCalcService } from '../../training/services/burden.calc.service';

import { PearItemModel } from '../models/pear.item.model';
import { DatasetModel } from '../models/dataset.model';
import { MicrocicleModel } from '../../training/models/microcicle.model';

@Injectable()
export class TrainingPlanChartService {
    constructor(
        private microcicleService: MicrocicleService,
        private loger: LogService,
        private calcService: BurdenCalcService
    ) {}
    /** Метод иницыализирует хранилище dataset's для выбраных тренировок */
    inintDatasetStoreForTraining(
        datasetStore: DatasetModel [],
        checkedTrainings: any,
        microcicles: MicrocicleModel [],
        characteristic: string
    ) {
        let copyDatasetStore = [...datasetStore];
        checkedTrainings.forEach((microcicleBox, mIndex: number) => {
            /** Этот счетчик будет указывать на позицию набора данных(dataset) */
            let counterTrueFlags = 0;
            microcicleBox.forEach((trainingFlag: boolean, tIndex: number) => {
                if (trainingFlag === true) {
                    counterTrueFlags++;
                    copyDatasetStore = this.setDatasetValue(
                        copyDatasetStore,
                        counterTrueFlags,
                        mIndex,
                        this.calcService.calculateTrainingParams(
                            Immutable.fromJS(microcicles[mIndex].trainingData[tIndex])
                        )[characteristic],
                        microcicles.length
                    );
                }
            });
        });
        return copyDatasetStore;
    }
    initDatasetFromPeatItem(data: any, microcicles: MicrocicleModel [], characteristic: string) {
        let resultDatasetStorage = [];
        if (data) {
            data.forEach(item => {
                resultDatasetStorage = [
                    ...resultDatasetStorage,
                    {
                        label: '',
                        data: this.mapPearDataToDataset(item, microcicles, characteristic)
                    }
                ];
            });
        }
        return resultDatasetStorage;
    }
    mapPearDataToDataset(pearData: PearItemModel [], microcicles: MicrocicleModel [], characteristic: string) {
        const result = [];
        pearData.forEach(pearItem => {
            if (!pearItem) {
                result.push(0);
                return;
            }
            result[pearItem.microcicleIndex] = this.calcService.calculateTrainingParams(
                Immutable.fromJS(microcicles[pearItem.microcicleIndex].trainingData[pearItem.trainingIndex])
            )[characteristic];
        });
        return result;
    }
    /** Метод иницыализирует хранилище dataset's для микроцыклов */
    initDatasetStoreForMicrocicles(
        checkedMicrocicles: any,
        microcicles: MicrocicleModel [],
        characteristic: string
    ) {
        const data = [];
        checkedMicrocicles.forEach((item, index: number) => {
            if (item === true) {
                data.push(
                    this.calcService.calculateTotalParams(
                        Immutable.fromJS(microcicles[index].trainingData)
                    )[characteristic]
                );
                return;
            }
            data.push(0);
        });
        return data;
    }
    /** Метод иницыализирует хранилище dataset's для одного микроцикла */
    initDatasetStoreForOneMicrocicle(microcicle: MicrocicleModel, checkedTrainings: any, characteristic: string) {
        const labels = [];
        const data = [];
        checkedTrainings.forEach((item, index: number) => {
            labels[index] = `Тренировка ${index + 1}`;
            data[index] = 0;
            if (item === true) {
                data[index] = this.calcService.calculateTrainingParams(
                    Immutable.fromJS(microcicle.trainingData[index])
                )[characteristic];
            }
        });
        return {
            labels,
            data
        };
    }
    /** Метод подсчитывает количество флагов которые установлены в true */
    countTrueFlags(store) {
        let counter = 0;
        store.forEach(item => {
            if (item === true) { counter++; }
        });
        return counter;
    }
    /**
     * Получаем dataset из хранилища, если dataset с таким индексом нету создаем его
     * @datasetIndex - результат работы метода countTrueFlags
     */
    setDatasetValue(datasetStore, datasetIndex: number, elementIndex: number, value: number, dataItemCount: number) {
        this.log(datasetIndex, 'Index of dataset object');
        this.log(datasetStore, 'Dataset store');
        this.log(elementIndex, 'Index of data in data property');
        let dataset = datasetStore[datasetIndex - 1];
        if (!dataset) {
            dataset = this.createDataset(datasetIndex, dataItemCount);
            dataset['data'][elementIndex] = value;
            return [...datasetStore, dataset];
        }
        const newDatasetStore = [...datasetStore];
        this.log(newDatasetStore, 'New dataset store');
        this.log(newDatasetStore[datasetIndex - 1].data, 'Dataset object from dataset store');
        newDatasetStore[datasetIndex - 1].data[elementIndex] = value;
        return newDatasetStore;
    }
    /**
     * Метод создает dataset
     * trainingIndex - индекс dataset в хранилище
     */
    createDataset(trainingIndex: number, dataItemCount: number, startValue = 0) {
        const result = [];
        for (let i = 0; i < dataItemCount; i++) {
            result[i] = startValue;
        }
        return {
            label: `Тренировка: ${trainingIndex}`,
            data: result
        };
    }

    /** Вспомогательные методы */
    createFlagArray(length: number, flag = false) {
        const result = [];
        for (let i = 0; i < length; i++) {
            result[i] = flag;
        }
        return result;
    }
    log(message: any, category = '') {
        this. loger.log(message, category);
    }
    getColor() {

    }
}
