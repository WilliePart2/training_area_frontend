import {ActionModel} from './action.model';

export interface ScrollActionModel extends ActionModel {
    data: {
        absolute: number;
        gap: number;
    };
}

export const enum ScrollTypes  {
    SCROLL_TO_TOP = 'SCROLL_TO_TOP',
    SCROLL_TO_BOTTOM = 'SCROLL_TO_BOTTOM'
}
