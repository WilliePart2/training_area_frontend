export class CommentAddedTextModel {
    constructor(
        public id: number,
        public comment_id: number,
        public text: string,
        public date: string
    ) {}
}
