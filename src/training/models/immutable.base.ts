/** Model created for typing Immutable.Map and Immutable.List with another class */
import * as Immutable from 'immutable';

export interface IImmutableBaseMap<T> extends Immutable.Map<string, any> {
    toJS(): T;
    // get<K extends keyof T>(key: K, notSetValue?: any): T[K];
    // set(key: string, value: any): Immutable.Map<string, any>;
}

export interface IImmutableBaseList<T> extends Immutable.List<T> {
  // toJS(): Array<T>;
  // get(index: number): T;
  // set(index: number, value: T): Immutable.List<T>;
  // update(index: number, noSetValue: T, updater: (value: T) => T): Immutable.List<T>;
  // update(index: number, updater: (value: T) => T): Immutable.List<T>;
  // push(value: T): Immutable.List<T>;
  // pop(): Immutable.List<T>;
  // shift(): Immutable.List<T>;
  // unshift(value: T): Immutable.List<T>;
  // map(func:(value?: T, index?: number, iter?: Iterable<number, T>) => Iterable<T>, context?: any): Immutable.List<T>;
  // forEach(func:(value: T, index?: number, iter?: Immutable.List<T>) => any, context?: any): any;
  // filter(func: (value: T, index?: number, iter?: Immutable.List<T>) => boolean): Immutable.List<T>;
  // delete(index:number): Immutable.List<T>;
  // rest(): Immutable.List<T>;
}
