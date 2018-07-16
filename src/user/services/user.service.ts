import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserManagerService } from '../../common/user.manager.service';
import { StoreService } from '../../common/store.service';
import { UrlService } from '../../common/url.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../../common/models/user';
import 'rxjs/add/operator/catch';
import {BaseService} from '../../common/base.service';

@Injectable()
export class UserService extends BaseService {
    constructor(
        private urlManager: UrlService,
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private store: StoreService
        ) {
        super(userManager, http);
    }

    /** Метод получает текущего ментора пользователя */
    fetchMentor() {
        // const token = this.userManager.accessToken;
        // if (token) {
        //     const headers = this.generateHeaders(token);
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlManager.getClientMainUrl()}/mentors/get-mentor`,
                {},
                {headers}
            );
        });
                // .map(response => {
                //     console.log(response);
                //     if (!response['data']) { return response; }
                //     const mentorData = response['data']['mentorData'];
                //     const requestedMentor = response['data']['requestToMentor'];
                //     const trainingPlans = response['data']['trainingData'];
                //     const result = {};
                //     if (mentorData) {
                //         result['mentor'] = {
                //             username: mentorData['mentor']['username'],
                //             type: mentorData['mentor']['type'],
                //             countTrainingPlans: mentorData['mentorData']['countTrainingPlans'],
                //             countPadawans: mentorData['mentorData']['countPadawans']
                //         };
                //     }
                //     if (requestedMentor) {
                //         result['requestedMentor'] = {
                //             username: requestedMentor['mentor']['username'],
                //             type: requestedMentor['mentor']['type'],
                //             countTrainingPlans: requestedMentor['mentorData']['countTrainingPlans'],
                //             countPadawans: requestedMentor['mentorData']['countPadawans']
                //         };
                //     }
                //     if (trainingPlans) {
                //         result['trainingData'] = {};
                //     }
                //     result['accessToken'] = response['accessToken'];
                //     result['result'] = response['result'];
                //     return result;
                // })
                // .catch(error => {
                //     console.log(error);
                //     return Observable.of(false);
                // });
        // } else {
        //     this.userManager.reloginUser();
        //     return Observable.of(false);
        // }
    }

    /** Метод возвращает всез пльзователей с заданым смещением и размером выдачи */
    fetchAllUsers(offset: number, limit: number) {
        const token = this.userManager.accessToken;
        if (token) {
            const headers = this.generateHeaders(token);
            return this.http.post(
                `${this.urlManager.getClientMainUrl()}/mentors/get-all-users?offset=${offset}&limit=${limit}`,
                {},
                {headers}
            );
        } else {
            return Observable.of(false);
        }
    }

    /** Метод разлогинивает пользователя */
    logout() {
        const token = this.userManager.accessToken;
        if (token) {
            return this.http.get(`${this.urlManager.getServerUrl()}/index/logout?at=${token}`)
                .catch(error => {
                    return Observable.of(false);
                });
        } else {
            this.userManager.redirectUser('');
        }
    }

    /** Методы для выбора ментора самостоятельно */
    sendBindingRequest(mentorId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlManager.getClientMainUrl()}/mentors/bind-mentor`,
                {
                        UsersManager: {
                            // mentorUsername,
                            // clientUsername: this.userManager.username
                            mentorId,
                            clientId: this.userManager.id
                        }
                    },
            {
                        headers
                    }
            );
        });
    }

    /** Метод отправляет запросы на отвязку пользователя от ментора */
    mentorUnbindHandler(mentorUsername: string, type: number) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.post(
            `${this.urlManager.getClientMainUrl()}/mentors/${type === 1 ? 'unbind-mentor' : 'reset-request-to-mentor'}`,
            {
                UsersManager: {
                    mentorUsername,
                    clientUsername: this.userManager.username
                }
            },
            {headers}
        );
    }

    /** Метод для получения приглашений от менторов */
    fetchRequestFromMentor(offset: number, limit: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlManager.getClientMainUrl()}/mentors/get-request-from-mentor?offset=${offset}&limit=${limit}`,
                {},
                {headers}
            );
        })
    }

    /** Методы для работы с предложениями от менторов */
    answerToMentorHandler(mentorId: number, answer: boolean) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlManager.getClientMainUrl()}/mentors/${answer === true ? 'accept-offer' : 'reject-offer'}`,
                {
                    UsersManager: {
                        mentorId,
                        clientId: this.userManager.id
                    }
                },
                {headers}
            );
        });
    }

    /** Хэлперы */
    /** Метод генерирует заголоки */
    generateHeaders(token: string) {
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        });
    }

    /** Сохраняет/Получает объект ментора которому отправлен запрос */
    set requestToMentor(data: User) {
        this.store.insert('requestToMentor', data);
    }
    get requestToMentor() {
        return this.store.get('requestToMentor');
    }

    /** Сохраняет/Отдает объект текущего ментора */
    set currentMentor(mentor: User) {
        this.store.insert('currentMentor', mentor);
    }
    get currentMentor() {
        return this.store.get('currentMentor');
    }
}
