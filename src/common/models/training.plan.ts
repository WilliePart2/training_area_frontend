export class TrainingPlan {
    constructor(
        public weight: number,
        public repeat: number,
        public repeatSections: number // Это типа подходы
    ) { }
}
