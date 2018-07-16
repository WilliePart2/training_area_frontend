import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { UrlService } from "../../common/url.service";
import { LogService } from "../../common/log.service";
import { AuthResponse } from "../models/AuthResponse";
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/observable/of';

@Injectable()
export class AuthorizationService {
    constructor(
        private url: UrlService,
        private http: HttpClient,
        private logService: LogService
    ) { }

    /** Авторизация рядового пользователя */
    authorizationUser(username: string, password: string) {
        const headers = new HttpHeaders();
        headers.set('Content-Type', 'application/json');
        return this.http.post(
            `${this.url.getServerUrl()}/index/user-login`,
            {UsersManager: {username, password}},
            {headers}
            )
            .catch(error => Observable.of({result: false, accessToken: ''}));
    }
    /** Авторизация ментора */
    authorizationMentor(username: string, password: string) {
        const headers = new HttpHeaders();
        headers.set('Content-Type', 'application/json');
        return this.http.post(
            `${this.url.getServerUrl()}/index/mentor-login`,
            {UsersManager: {username, password}},
            {headers}
            )
            .catch(error => {
                return Observable.of({result: false, accessToken: ''})
            });
    }

    /** Регистрация ментора */
    prepareRegistrationData(username: string, email: string, password: string , password_repeat: string) {
        return {
            UsersManager: {
                username,
                email,
                password,
                password_repeat
            }
        };
    }
    registrationMentor(username: string, email: string, password: string, password_repeat: string) {
        const body = this.prepareRegistrationData(username, email, password, password_repeat);
        const headers = new HttpHeaders();
        headers.set('Content-Type', 'application/json');
        return this.http.post(`${this.url.getServerUrl()}/index/mentor-registration`, body, {headers})
            .catch(error => {
                this.logService.log(error);
                return Observable.of({result: false, accessToken: '', expire: 0});
            });
    }
    /** Регистрация пользователя */
    registrationUser(username: string, email: string, password: string, password_repeat: string) {
        const body = this.prepareRegistrationData(username, email, password, password_repeat);
        const headers = new HttpHeaders();
        headers.set('Content-Type', 'application/json');
        return this.http.post(`${this.url.getServerUrl()}/index/user-registration`, body, {headers})
            .catch(error => {
                this.logService.log(error, 'Error when tries register user');
                return Observable.of({result: false, accessToken: '', expire: 0});
            });
    }
    /** Выход пользователя/ментора */
    logoutUser(token) {
        return this.http.get(`${this.url.getServerUrl()}/index/logout?at=${token}`)
            .catch(error => {
                this.logService.log('Error when tries to logout', 'Http error');
                return Observable.of(false);
            });
    }
}
