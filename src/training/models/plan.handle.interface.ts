export interface PlanHandleInterface {
    getReadableCategoryValue: (category: number) => 'Без категории' | 'Для новичков' | 'Для среднего уровня' | 'Для высокого уровня';
}
