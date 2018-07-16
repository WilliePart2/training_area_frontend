import { ListItem } from './list.item';

/** стандартные модели для контента */
export  interface BasePostModel {
    id: number;
    postId: number;
    header: string;
    content: string | Array<ListItem>;
    type: string;
}

export type ArticlePostModel = BasePostModel;

export interface VideoPostModel extends BasePostModel {
    url: string;
}

export type ListPostModel = BasePostModel;

/** модели для отображаемого контента */
export interface BaseDisplayedPostModel extends BasePostModel {
    likes: number;
    dislikes: number;
    views: number;
    isUserLiked: boolean;
    isUserDisliked: boolean;
}

export type DisplayedArticlePostModel = BaseDisplayedPostModel;
export interface DisplayedVideoPostModel extends BaseDisplayedPostModel, VideoPostModel {}
export interface DisplayedListPostModel extends BaseDisplayedPostModel, ListPostModel {}

export class NewPostModel {
    constructor(
        public header: string,
        public content: string | Array<ListItem>,
        public type: string
    ) {}
}

export interface NewPostDataModel {
    postId: number;
    content: Array<NewPostContentModel>;
}

export interface NewPostContentModel {
    oldId: number;
    newId: number;
}

export interface AlteredListModel {
    postId: number;
    type: string;
    newItems: ListItem[];
    removingItems: ListItem[];
    alteredItems: ListItem[];
}

export interface NewListItemsData {
    oldItemId: number | string;
    newItemId: number | string;
}
