export class EditExerciseModel {
    constructor(
        public id: number, /** id обычного упражнения */
        public uniqueId: string,
        public name: string,
        public oneRepeatMaximum: number,
        public group: string
    ) {}
}
