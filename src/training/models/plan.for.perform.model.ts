import { IImmutableBaseMap, IImmutableBaseList } from './immutable.base';

export interface IListPlansForPerformModel extends IImmutableBaseList<IPlanForPerformModel> {}
export interface IPlanForPerformModel extends IImmutableBaseMap<IPlanForPerformMutableModel> {}
export interface IPlanForPerformMutableModel {
    id: number;
    parentPlanId: number;
    /** то что запланированно */
    planWeight: number;
    planRepeats: number;
    planRepeatSection: number; /** всегда 1 */
    /** то что сделал пользователь */
    doneWeight: number;
    doneRepeats: number;
    doneRepeatSection: number; /** по умолчанию 0 после выполнения устанавливаеться в 1 */
    isComplete: boolean;
    isFullDone: boolean;
    order: number;
}
