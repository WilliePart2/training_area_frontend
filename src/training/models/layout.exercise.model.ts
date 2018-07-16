export interface LayoutExerciseModel {
        id: number; /** id тренировочного упражнения */
        // public uniqueId: string, /** уникальный идентификатор тренировочного упражнения */
        exercise: LayoutExercise;
        oneRepeatMaximum: number;
}

export interface LayoutExercise {
    id: number; /** id обычного упражнения */
    name: string;
    group: string;
    groupId: number;
}

/** Модель данных для списка упражнений */
export interface Exercise extends LayoutExerciseModel {
    checked: boolean;
}
