import { IImmutableBaseMap } from './immutable.base';

export interface Completed {
    id: number;
}
export type CompletedMicrocicleModel = Completed;
export type CompletedTrainingModel = Completed;

export interface IImCompletedTrainingModel extends IImmutableBaseMap<CompletedTrainingModel> {}
export interface IImCompletedMicrocicleModel extends IImmutableBaseMap<CompletedMicrocicleModel> {}
