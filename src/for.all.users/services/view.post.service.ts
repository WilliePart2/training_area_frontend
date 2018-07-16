import { Injectable } from '@angular/core';
import { ListPostModel, NewListItemsData } from '../models/posts.models';
import { ListItem } from '../models/list.item';

@Injectable()
export class ViewPostService {
    cretaeNewListItems(content: string) {
        return new ListItem(this.generageId(), content, false);
    }
    generageId() {
        return Math.round(Date.now() + Math.random() * 100);
    }
    makeFlagsForListItems(count: number): boolean[] {
        const result: boolean [] = [];
        for (let i = 0; i < count; i++) {
            result[i] = false;
        }
        return result;
    }
    getAlteredItems(previousPost: ListPostModel, newPost: ListPostModel) {
        let result = [];
        if (!previousPost || !newPost) { return result; }
        if (Array.isArray(previousPost.content) && Array.isArray(newPost.content)) {
            result = newPost.content.reduce((store, item) => {
                const findedItem = Array.isArray(previousPost.content) ? previousPost.content.find(searchItem => +searchItem.id === +item.id) : false;
                if (findedItem && findedItem.value !== item.value) {
                    store.push(item);
                }
                return store;
            }, result);
        }
        return result;
    }
    swapListItemsIds(oldItems: ListItem[], newData: NewListItemsData[]) {
        return oldItems.reduce((store, item) => {
            const findedItem = newData.find(searchItem => +searchItem.oldItemId === +item.id);
            findedItem ? store.push({...item, id: findedItem.newItemId}) : store.push({...item});
            return store;
        }, []);
    }
}
