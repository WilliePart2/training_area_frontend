import { CommentAddedTextModel } from './comment.added.text.model';

export class CommentItemModel {
    constructor(
        public id: number,
        public user: User,
        public text: string,
        public addingText: CommentAddedTextModel [],
        public date: string,
        public like: number,
        public dislike: number,
        public hasLike: boolean,
        public hasDislike: boolean
    ) {}
}

export interface User {
    id: number;
    username: string;
    avatar: string;
}
