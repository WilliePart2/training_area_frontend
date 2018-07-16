import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { UserPageDataService } from '../../services/user.page.data.service';
import { TotalMessageService } from '../../services/total.message.service';

@Component({
    selector: 'app-user-page-header',
    templateUrl: './user.page.header.component.html',
    styleUrls: ['./user.page.header.component.css']
})

export class UserPageHeaderComponent extends ProtectedComponent implements OnInit, OnChanges {
    ownId: number;
    @Input() userId: number;
    @Input() username: string;
    _isFollowed: boolean;
    @Input() followed: number;
    followButtonThinking: boolean;
    _ratingInit: boolean;
    _rating: number;
    @Input('ratin') set rating(val: number) {
        this._rating = val;
        if (this._ratingInit) {
            this.setRating(val);
        }
        this._ratingInit = true;
    }
    get rating() { return this._rating; }
    constructor(
        protected userManager: UserManagerService,
        private pageService: UserPageDataService,
        private messageService: TotalMessageService
    ) {
        super(userManager);
    }
    ngOnInit() {
        this.ownId = this.userManager.id;
        this._isFollowed = !!this.followed;
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.followed) {
            this._isFollowed = !!this.followed;
        }
    }
    followThisUser() {
        if (this.checkUserIdentity()) { return; }
        this.followButtonThinking = true;
        this.pageService.toggleFollowing(this.userId, this.ownId).subscribe(response => {
            this.followButtonThinking = false;
            this.checkResponse(response, resp => {
                if (resp['data'].toLowerCase() === 'subscribe') {
                    this._isFollowed = true;
                    this.messageService.sendSuccessMessage('Вы успешно подписались на обновления пользователя');
                }
            });
        }, error => {
            this.followButtonThinking = false;
            this.messageService.sendErrorMessage();
        });

    }
    unfollowThisUser() {
        if (this.checkUserIdentity()) { return; }
        this.followButtonThinking = true;
        this.pageService.toggleFollowing(this.userId, this.ownId).subscribe(response => {
            this.followButtonThinking = false;
            this.checkResponse(response, resp => {
                if (resp['data'].toLowerCase() === 'unsubscribe') {
                    this._isFollowed = false;
                    this.messageService.sendSuccessMessage('Вы успешно отписались от пользователя');
                }
            });
        }, error => {
            this.followButtonThinking = false;
            this.messageService.sendErrorMessage();
        });
    }
    setRating(value: number) {
        if (this.checkUserIdentity()) { return; }
        this.pageService.setUserRating(this.userId, value).subscribe(response => {
            this.checkResponse(response, resp => {
                // Уведомить пользователя об УСПЕШНОЙ или НЕУСПЕШНОЙ устновке рейтинга.
                this.messageService.sendSuccessMessage('Вы успешно оценили пользователя');
                console.log(resp);
            });
        }, error => {
            this.messageService.sendErrorMessage();
        });
    }
    checkUserIdentity() {
        return parseInt(String(this.userId), 10) === parseInt(String(this.ownId), 10);
    }
}
