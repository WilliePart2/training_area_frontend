import { Component, OnInit } from '@angular/core';
import { UserManagerService } from '../../../common/user.manager.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { User } from '../../../common/models/user';
import { UserService } from '../../services/user.service';
import { UserCacheService } from '../../services/user.cache.service';
import { LogService } from '../../../common/log.service';

@Component({
    selector: 'app-user-mentors-all-users',
    templateUrl: './mentors.all.users.component.html'
})

export class MentorsAllUsersComponent extends ProtectedComponent implements OnInit {
    type = this.userManager.type;
    users: User [];
    /** Логин пользователя в карточке которого рендерить ошибку */
    errorAccount: string;

    constructor(
        protected userManager: UserManagerService,
        private userService: UserService,
        private logService: LogService,
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
        this.userService.fetchAllUsers(this.offset, this.limit).subscribe(response => {
            /** Обрабатываем ошибку на стороне сервера */
            if (!response) {
                this.errorMessage('Ошибка соединения с сервером, данные о пользователях не получены');
                return;
            }

            /** Обрабатываем пустые данные */
            if (!response['result']) { return; }
            this.totalCount = response['totalCount'];

            /** Обрабатываем данные о пользователях */
            this.users = this.filteringUsers(response['data']);
            this.resetErrorMessage();
        }, error => {
            /** Обрабатываем ошибку соединения */
            this.errorMessage('Ошибка соединения с сервером, данные о пользователях не получены');
        });
    }

    /** Метод отправки запроса ментору */
    sendRequestToMentor(user: User) {
        this.userService.sendBindingRequest(user.username).subscribe(response => {
            /** Обрабатываем ошибку поизошедшую на стороне сервера */
            if (!response) {
                this.errorMessage('Ошибка соединения, запрос не отправлен');
                this.errorAccount = user.username;
                return;
            }

            if (!response['result']) { return; }

            this.userCache.requestedMentor = user; // Добавляем пользователя которому отправлен запрос в хранилище
            this.users = this.filteringUsers(this.users); // Фильтруем вывод данных не выводя тех пользователей которым отправлен запрос
            this.resetErrorMessage();
            this.logService.log(this.userService.requestToMentor, 'Request to mentor');
        }, error => {
            /** Обрабатываем ошибку соединения */
            this.logService.log('Error when tries to fetch data');
            this.errorMessage('Ошибка соединения запрос не отправлен');
        });
    }

    /** Метод фильтрации данных о пользователях */
    filteringUsers(data: User []): User [] {
        const result = [];
        const sendedRequest = this.userCache.requestedMentor;
        const currentMentor = this.userCache.currentMentor;
        const fromMentor = this.userCache.fromMentor;
        const selfUsername = this.userManager.username;
        console.log('Current mentor:');
        console.log(currentMentor);
        console.log(sendedRequest);
        console.log(fromMentor);
        console.log(selfUsername);

        data.forEach(item => {
            if (sendedRequest && (item.username === sendedRequest.username)) { return; }
            if (currentMentor && (item.username === currentMentor.username)) { return; }
            if (selfUsername && (item.username === selfUsername)) { return; }

            if (fromMentor) {
                let hasMatch = false;
                fromMentor.forEach(fromMentorItem => {
                    if (fromMentorItem.username === item.username) {
                        hasMatch = true;
                        return;
                    }
                });
                if (hasMatch) { return; }
            }

            result.push(item);
        });

        return result;
    }
}
