import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StoreService } from '../../common/store.service';
import { UrlService } from '../../common/url.service';
import { UserManagerService } from '../../common/user.manager.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../../common/models/user';
import 'rxjs/add/operator/catch';
import {BaseService} from '../../common/base.service';

@Injectable()
export class MentorService extends BaseService {
    _ownPadawans: User [];

    constructor(
        protected http: HttpClient,
        private urlService: UrlService,
        protected userManager: UserManagerService,
        private store: StoreService
    ) {
        super(userManager, http);
    }

    /**
     * Методы привязки пользователя
     */
    sendBindRequest(clientId: number): Observable <any> {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorMainUrl()}/padawan/bind-user`,
                {
                    UsersManager: {
                        // mentorUsername: this.userManager.username,
                        mentorId: this.userManager.id,
                        // clientUsername
                        clientId
                    }
                },
                {
                    headers
                }
            );
        });
        // const token = this.userManager.accessToken;
        // if (token) {
        //     const headers = new HttpHeaders({
        //         'Accept': 'application/json',
        //         'Authorization': `Bearer ${token}`
        //     });
        //     return this.http.post(
        //         ,
        //         ,
        //         { headers }
        //         )
        //         .catch(error => {
        //             return Observable.of(false);
        //         });
        // } else {
        //     this.userManager.reloginUser();
        //     return Observable.of(false);
        // }
    }
    sendUnbindRequest(clientUsername: string) {
        const token = this.userManager.accessToken;
        if (token) {
            const headers = this.generateHeaders(token);
            return this.http.post(
                `${this.urlService.getMentorMainUrl()}/padawan/unbind-user`,
                {
                    UsersManager: {
                        mentorUsername: this.userManager.username,
                        clientUsername
                    }
                },
                {headers}
                );
        } else {
            return Observable.of(false);
        }
    }

    /** Метод удаляет указаного ученика */
    removeOwnLearner(learnerId: number) {
       return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorMainUrl()}/padawan/remove-own-learner`,
                {
                    UsersManager: {
                        mentorId: this.userManager.id,
                        clientId: learnerId
                    }
                },
                {headers}
            )
       });
    }

    /** Методы ответа на приглашения пользователя */
    handlePadawan(clientId: number, answer: boolean) {
        // const token = this.userManager.accessToken;
        // if (token) {
        //     const headers = this.generateHeaders(token);
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorMainUrl()}/padawan/${answer ? 'accept-padawan' : 'reject-padawan'}`,
                {
                    UsersManager: {
                        clientId,
                        mentorId: this.userManager.id
                    }
                },
                {headers}
            );
        });
        // } else {
        //     this.userManager.reloginUser();
        //     return Observable.of(false);
        // }
    }

    /**
     * Хэлперы
     */
    generateHeaders(token: string) {
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        });
    }

    /**
     * Методы работы с данными
     */
    /** Работа с хранилишем собственных подопечных */
    set ownPadawans(data: User []) {
        console.log(data);
        this.store.insert('ownPadawans', data);
    }
    get ownPadawans(): User [] {
        return this.store.get('ownPadawans');
    }

    /** Работа с хранилищем отправленых запросов */
    get fromMentor() {
        return this.store.get('fromMentor');
    }
    set fromMentor(data: User []) {
        this.store.insert('fromMentor', data);
    }
    deleteRequestFromMentor(clientUsername: string) {
        const oldRequestsFromMentor = this.fromMentor;
        const newRequestFromMentor = [];
        oldRequestsFromMentor.forEach(item => {
            console.log('Item username: ' + item.username);
            console.log('Client username: ' + clientUsername);
            if (item.username === clientUsername) return;
            newRequestFromMentor.push(item);
        });
        this.fromMentor = newRequestFromMentor;
    }
    addRequestFromMentor(item: User) {
        const newRequestFromMentor = [];
        this.fromMentor.forEach(data => {
            if (data.username === item.username) { return; }
            newRequestFromMentor.push(data);
        })
        this.fromMentor = [item, ...newRequestFromMentor];
    }

    /** Работа с хранилищем полученых запросов */
    get toMentor() {
        return this.store.get('toMentor');
    }
    set toMentor(data: User []) {
        this.store.insert('toMentor', data);
    }
    deleteUserFromRequestToMentor(username: string) {
        const result = [];
        this.toMentor.forEach(item => {
            if(item.username === username) { return; }
            result.push(item);
        });
        this.toMentor = result;
    }
}
