import { Injectable } from '@angular/core';
import { StoreService } from './store.service';

@Injectable()
export class CacheService {
    constructor(private store: StoreService) {}

    cacheStore: object = {};
    cacheExpire: number;
    createdDate: number;

    validateCache() {
        /** Временная заглушка */
        return false;
    }

    search(key: string) {
        if (this.validateCache()) {
            return this.cacheStore[key] ? this.store.get(key) : false;
        }
        return false;
    }

    insert(key: string, data: any) {
        this.cacheStore[key] = true;
        this.store.insert(key, data);
    }

    update(key: string, data: any) {
        if (!this.cacheStore[key]) {
            this.insert(key, data);
            return;
        }
        this.store.update(key, data);
    }

    remove(key: string) {
        this.cacheStore[key] ? delete this.cacheStore[key] : '';
        this.store.remove(key);
    }

    has(key: string) {
        return !!(this.cacheStore[key]);
    }

    add(key: string, data: any) {
        if (!this.has(key)) {
            this.insert(key, [data]);
            return;
        }
        this.store.add(key, data);
    }
}

