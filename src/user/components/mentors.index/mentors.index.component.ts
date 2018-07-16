import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { LogService } from '../../../common/log.service';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { User } from '../../../common/models/user';
import { UserCacheService } from '../../services/user.cache.service';
import {UserManipulateBaseComponent} from '../../../mentor/components/user.manipulate/user.manipulate.base.component';

@Component({
    selector: 'app-user-mentors-index',
    templateUrl: './mentors.index.component.html'
})
export class MentorsIndexComponent extends UserManipulateBaseComponent implements OnInit {
    /** Информация о текущем менторе */
    mentor: User;
    mentorData: any;
    mentorIsEmpty = true;
    /** Информация о менторе которому послан запрос */
    requestedMentor: User;
    requestedMentorData: any;
    hasRequestedMentor = false;

    trainingFromMentor: any; // Пока что тут заглушка в будущем будет модель. Нужно сделать сначала кабинет тренировок

    constructor(
        protected userManager: UserManagerService,
        private userService: UserService,
        private logService: LogService,
        private userCache: UserCacheService
    ) {
        super(userManager);
    }

    ngOnInit() {
        super.ngOnInit();
        this.userService.fetchMentor().subscribe(response => {
            // /** Обрабатываем ошибку произошедшую на сервере */
            // if (!response) {
            //     this.errorMessage('Неудалось загрузить данные о текущем наставнике');
            // }

            // /** Обновляем токен доступа */
            // this.userManager.reNewAccessToken(response['accessToken']);
            // if (!response['result']) { return; }

            /** Обрабатываем данные текущего ментора */
            // if (response['mentor']) {
                this.mentor = response['data']['currentMentor'];
                // this.userCache.currentMentor = response['mentor']; // Добавляем в хранилище для фильрации
                // this.trainingFromMentor = response['trainingData'];
                // this.mentorIsEmpty = false;
            // }

            /** Обрабатываем данные ментора которому послан запрос на свзяь */
            if (response['data']['requestToMentor']) {
                this.requestedMentor = response['requestedMentor'];
                // this.userCache.requestedMentor = response['requestedMentor']; // Добавляем в хранилище для фильтрации
                // this.hasRequestedMentor = true;
                // this.logService.log(this.requestedMentor, 'Ментор которому отправлен запрос');
            }

            /** Загружаем данные о менторе который прислал приглашение */
            this.userService.fetchRequestFromMentor(this.offset, this.limit).subscribe(resp => {
                const check = this.checkError(resp, 'Ошибка соединения с сервером, данные о пользователях не получены');
                this.userManager.reNewAccessToken(resp['accessToken']);
                if (!check) { return; }
                this.userCache.fromMentor = resp['data'];
            }, error => {
                this.errorMessage('Ошибка соединения с сервером, данные о пользователях не получены');
            });
        }, error => {
            this.errorMessage('Ошибка соединения с сервером');
        });
    }

    /**
     * Метод отправляет запрос на отказ от текущего ментора
     */
    removeMentor(mentor: User) {
        this.userService.mentorUnbindHandler(mentor.username, 1).subscribe(response => {
            const check = this.checkError(response, 'Ошибка соединения с сервером запрос не отправлен');
            this.userManager.reNewAccessToken(response['accessToken']);
            if (!check) { return; }
            this.mentorIsEmpty = true;
            this.userCache.removeCurrentMentor();
            this.userCache.fromMentor = this.userCache.removeFromMentor(mentor);
            this.mentor = this.userCache.currentMentor;
        });
    }

    /***
     * Метод отменяет запрос на связь с ментором
     */
    resetRequestToMentor(mentor: User) {
        this.userService.mentorUnbindHandler(mentor.username, 2).subscribe(response => {
            const check = this.checkError(response, 'Ошибка соединения с сервером запрос не отправлен');
            this.userManager.reNewAccessToken(response['accessToken']);
            if (!check) { return; }
            this.hasRequestedMentor = false;
            this.userCache.removeRequestedMentor();
            this.requestedMentor = this.userCache.requestedMentor;
        });
    }
}
