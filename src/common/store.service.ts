import { Injectable } from '@angular/core';

@Injectable()
export class StoreService {
    store: object = {};
    insert(key: string, data: any) {
        this.store[key] = data;
    }
    get(key: string) {
        return this.store[key];
    }
    update(key: string, data: any) {
        const newStore = {};
        for (const prop in this.store) {
            if (prop === key) {
                newStore[prop] = data;
                continue;
            }
            newStore[prop] = this.store[prop];
        }
        this.store = newStore;
    }
    remove(key: string) {
        delete this.store[key];
    }
    add(key: string, data: any) {
        const newStore = {};
        for (const prop in this.store) {
            if (prop === key) {
                newStore[prop] = [...this.store[prop], data];
                continue;
            }
            newStore[prop] = this.store[prop];
        }
        this.store = newStore;
    }
}
