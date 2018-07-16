export class ActionModel {
    constructor(
        public type: string,
        public data: any
    ) {}
}

export interface ScrollActionModel extends ActionModel {
    data: {
        absolute: number;
        gap: number;
    };
}
