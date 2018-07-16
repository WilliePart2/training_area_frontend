import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, group } from '@angular/animations';
import { UserPageBasePostComponent } from '../user.page.base.post.component/user.page.base.post.component';
import { UserPageDataService } from '../../services/user.page.data.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { PostService } from '../../services/post.service';
import { TotalMessageService } from '../../services/total.message.service';
import { PostRelationService } from '../../services/post.relation.service';

import { ListItem } from '../../models/list.item';
import { NewPostModel } from '../../models/posts.models';

@Component({
    selector: 'app-user-page-create-post',
    templateUrl: 'user.page.create.post.component.html',
    providers: [PostService],
    animations: [
        trigger('entry', [
            transition('void => *', [
                style({
                    opacity: 0,
                    width: 0,
                    padding: 0,
                    margin: 0
                }),
                animate('300ms', style({
                    opacity: 1,
                    width: '*',
                    padding: '*',
                    margin: '*'
                }))
            ])
        ]),
        trigger('leave', [
            transition('* => void', [
                style({
                    opacity: 1,
                    width: '*',
                    padding: '*',
                    margin: '*'
                }),
                animate('300ms', style({
                    opacity: 0,
                    width: 0,
                    padding: 0,
                    margin: 0
                }))
            ])
        ])
    ]
})

export class UserPageCreatePostComponent extends UserPageBasePostComponent implements OnInit {
    listItemOrder = 0;
    createdListItems: Array<ListItem>;
    newListItem: string;

    submitLabel = 'Добавить пост';

    videoRegExp = /^[\-_=0-9A-Za-z]+$/;
    _errorMessage = 'Некорректно заполнено поле';
    constructor(
        private dataService: UserPageDataService,
        private postRelation: PostRelationService,
        private postService: PostService,
        private messageService: TotalMessageService,
        protected userManager: UserManagerService
    ) {
        super(userManager);
    }

    ngOnInit() {
        if (!this.type) {
            this.type = 'article';
        }
    }
    toggleAccordion(event: MouseEvent) {
        super.toggleAccordion(event);
        this.resetPostData();
    }
    createListItem() {
        if (this.newListItem) {
            if (Array.isArray(this.createdListItems)) {
                this.createdListItems.push(new ListItem(this.listItemOrder++, this.newListItem));
            } else {
                this.createdListItems = [new ListItem(this.listItemOrder++, this.newListItem)];
            }
            this.newListItem = '';
        }
    }
    removeListItem(itemId: number) {
        this.createdListItems = this.postService.removeListItem(this.createdListItems, itemId);
    }
    trackListItem(index: number, item: ListItem) {
        return item && item.id;
    }
    setPostType(type: 'article' | 'list' | 'video') {
        this.type = type;
        this.resetPostData();
    }
    setVideoId(value: string) {
        if (value.search(this.videoRegExp) !== -1) {
            console.log('video valid');
            this.resetErrorMessage();
        } else {
            console.log('video invalid');
            this.errorMessage();
        }
        this.content = value;
    }
    resetPostData() {
        this.content = '';
        this.content = '';
        this.header = '';
        this.createdListItems = null;
        this.newListItem = '';
    }
    createPost() {
        this.enableDimmer();
        const content = this.type !== 'list' && this.type !== 'voting_list' ? this.content : this.createdListItems;
        if (this.type === 'video') {
            const val = <string>this.content;
            if (val.search(this.videoRegExp) === -1) {
                this.errorMessage();
                this.disableDimmer();
                return;
            }
        }
        let post: any = new NewPostModel(this.header, content, this.type);
        this.postService.createPost(post).subscribe(response => {
            this.checkResponse(response, resp => {
                post = this.postService.replaceIdsInPosts(post, resp['data']);
                this.postRelation.addPost(post);
                this.resetPostData();
                this.accordionOpen = false;
                this.disableDimmer();
                this.messageService.sendSuccessMessage('Пост добавлен успешно');
            });
        }, error => {
            this.disableDimmer();
            this.messageService.sendErrorMessage('Ошибка соединения');
        });
    }
}
