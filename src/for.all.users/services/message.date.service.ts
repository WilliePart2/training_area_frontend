import { Injectable } from '@angular/core';
import { LabelService } from '../../common/label.service';
import { Dates } from '../models/message.dates.model';

import { LABEL_GROUP_NAMES } from '../../common/models/label.group.names';
import { MessageDateLabels } from '../../common/models/message.date.labels';

const enum _ {
    timeInterval,
    timeLabel
}

@Injectable()
export class MessageDateService {
    dateLabels: [number, string][] = [];
    stdLabel: string;

    _timeLabels: MessageDateLabels;
    _dates = new Dates();

    constructor(
        private labelService: LabelService
    ) {
        this.stdLabel = 'Некоторое время назад';
        const labels = labelService.getLabels();
        this._timeLabels = labels[LABEL_GROUP_NAMES.MESSAGE_DATE_LABELS];
        const timeKeys = Object.keys(this._dates);
        const tLabelKeys = Object.keys(this._timeLabels);
        timeKeys.forEach(timePoint => {
           const _lcTPoint = timePoint.toLowerCase();
           const tpLabel = tLabelKeys.find(tpLabelItem => tpLabelItem.replace(/_{1}/g, '').toLowerCase() === _lcTPoint);
           this.addDateLabel(this._dates[timePoint], tpLabel ? this._timeLabels[tpLabel] : this.stdLabel);
        });
        this.dateLabels = this.dateLabels.reverse();
    }

    addDateLabel(timeInterval: number, label: string) {
        this.dateLabels.push([timeInterval, label]);
    }

    /** datetime from DB */
    findMostCompatibleLabel(date: string) {
        const now = Math.round(Date.now() / 1000);
        const timezoneOffset = (new Date()).getTimezoneOffset() * 60;
        const currentDate = Math.round(Date.parse(date) / 1000) - timezoneOffset;
        const timegap = now - currentDate;
        let result = new Date(currentDate).toLocaleString();
        let isLessThenOneHour = false;
        this.dateLabels.forEach(item => {
            if (timegap < 60 * 60 && timegap > 60) {
                const minutes = Math.round(timegap / 60);
                const lastDigit = Number(minutes.toString().slice(-1));
                isLessThenOneHour = true;
                if ([1, 21, 31, 41, 51].indexOf(lastDigit) !== -1) {
                    result = `${minutes} ${this._timeLabels.LESS_THEN_ONE_HOUR_PREFIX_A}`;
                    return;
                }
                if ([2, 3, 4, 22, 23, 24, 32, 33, 34, 42, 43, 44, 52, 53, 54].indexOf(lastDigit) !== -1) {
                    result = `${minutes} ${this._timeLabels.LESS_THEN_ONE_HOUR_PREFIX_I}`;
                    return;
                }
                result = `${minutes} ${this._timeLabels.LESS_THEN_ONE_HOUR_PREFIX_STD}`;
            }
            if (timegap < item[_.timeInterval] && !isLessThenOneHour) {
                result = item[_.timeLabel];
            }
        });
        return result;
    }

    convertToReadable(date: string) {
        if (!this.dateLabels || !this.dateLabels.length) { return date; }
        if (!date) { return date; }
        return this.findMostCompatibleLabel(date);
    }
}
