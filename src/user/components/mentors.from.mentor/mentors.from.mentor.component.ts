import { Component, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { UserService } from '../../services/user.service';
import { UserCacheService } from '../../services/user.cache.service';
import { User } from '../../../common/models/user';

@Component({
    selector: 'app-user-mentors-from-mentor',
    templateUrl: './mentors.from.mentor.component.html'
})
export class MentorsFromMentorComponent extends ProtectedComponent implements OnInit {
    mentors: User [];
    hasRequestFromMentors = false;
    accountError: string;

    constructor(
        protected userManager: UserManagerService,
        private userService: UserService,
        private userCache: UserCacheService
    ) {
        super(userManager);
    }

    get page() {
        return this._page;
    }

    set page(pageNumber: number) {
        this._page = pageNumber;
        this.correctOffset();
        this.initialize();
    }

    ngOnInit() {
        this.initialize();
    }

    initialize() {
        this.userService.fetchRequestFromMentor(this.offset, this.limit).subscribe(response => {
            const check = this.checkError(response , 'Ошибка соединения с сервером данные о пользователях не получены');
            this.userManager.reNewAccessToken(response['accessToken']);
            this.totalCount = response['totalCount'];
            if (!check) { return; }
            this.mentors = response['data'];
            this.userCache.fromMentor = response['data'];
            this.hasRequestFromMentors = true;
        });
    }

    acceptOffer(mentor: User) {
        this.userService.answerToMentorHandler(mentor.username, 1).subscribe(response => {
            const check = this.checkError(response, 'Ошибка соединения с сервером запрос не отправлен');
            this.accountError = mentor.username;
            this.userManager.reNewAccessToken(response['accessToken']);
            if (!check) { return; }
            this.mentors = this.filterMentors(this.mentors, mentor.username);
            this.userCache.fromMentor = this.userCache.addFromMentor(mentor);
        }, eror => {
            this.errorMessage('Ошибка соединения с сервером, запрос не отправлен');
            this.accountError = mentor.username;
        });
    }

    rejectOffer(mentor: User) {
        this.userService.answerToMentorHandler(mentor.username, 2).subscribe(response => {
            const check = this.checkError(response, 'Ошибка соединения с сервером, запрос не отправлен');
            this.accountError = mentor.username;
            this.userManager.reNewAccessToken(response['accessToken']);
            if (!check) { return; }
            this.mentors = this.filterMentors(this.mentors, mentor.username);
            this.userCache.fromMentor = this.userCache.removeFromMentor(mentor);
        }, error => {
            this.errorMessage('Ошибка соединения с сервером, запрос не отправлен');
            this.accountError = mentor.username;
        });
    }

    /** Хэлперы */
    filterMentors(mentors: User [], filterUsername: string) {
        const result = [];
        mentors.forEach(item => {
            if (item.username === filterUsername) {
                return;
            }
            result.push(item);
        });
        return result;
    }
}
