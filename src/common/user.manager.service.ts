import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {BasicPathModel} from './models/basic.path.model';
import {AppService} from './app.service';

@Injectable()
export class UserManagerService {
    /**
     * user types
     */
    static MENTOR = 'mentor';
    static USER = 'user';
    
    private _accessToken: string;
    private _username: string;
    private _type: 'mentor' | 'user';
    private _id: number;
    private _avatar: string;
    private _avatarSubject: BehaviorSubject<any>;
    accessTokenExpire: number;
    tokenSetDate: number;

    private _appPaths: BasicPathModel;

    constructor(
        private router: Router,
        private appManager: AppService
    ) {
        this._appPaths = this.appManager.getAppPath();
    }

    /**
     * Методы для контроля доступа пользователя
     */

    redirectUser(route: any, queryParams = {}) {
        if (!route) { route = ''; }

        if (Array.isArray(route)) {
            this.router.navigate(route, {queryParams});
            return;
        }

        this.router.navigate([`/${route}`], {queryParams});
    }

    reloginUser() {
        this.resetAccessToken();
        this.redirectUser('login');
    }

    /**
     * Методы работы с токеном доступа
     */
    saveAccessToken(token: string, expire: number = 0) {
        this.accessToken = token;
        localStorage.setItem('accessToken', token);
        // this.accessTokenExpire = expire;
    }

    validateAccessToken() {
        // return !!(this._accessToken);
        return true;
    }

    resetAccessToken() {
        this.accessToken = '';
        // this.accessTokenExpire = 0;
    }
    reNewAccessToken(newToken: string) {
        this.accessToken = newToken;
    }
    /** гетеры и сетеры */
    /** Токен */
    get accessToken() {
        if (this.validateAccessToken()) {
            if (this._accessToken) {
                return this._accessToken;
            } else {
                return localStorage.getItem('accessToken');
            }
        }
        return '';
    }
    set accessToken(token: string) {
        this._accessToken = token;
        localStorage.setItem('accessToken', token);
        // this.tokenSetDate = Date.now() / 1000;
    }
    /** Данные пользователя */
    get username() {
        return this._username ? this._username : localStorage.getItem('username');
    }
    set username(username: string) {
        this._username = username;
        localStorage.setItem('username', username);
    }

    get type(): 'mentor' | 'user' {
        return this._type ? this._type : <'mentor' | 'user'>localStorage.getItem('typeUserAccount');
    }
    set type(type: 'mentor' | 'user') {
        this._type = type;
        localStorage.setItem('typeUserAccount', type);
    }

    get id() {
        return this._id ? this._id : parseInt(localStorage.getItem('userId'), 10);
    }
    set id(userId: number) {
        this._id = userId;
        localStorage.setItem('userId', `${userId}`);
    }
    /** Методы управления аватарами пользователей */
    initAvatarSubject() {
        this._avatarSubject = new BehaviorSubject(this.avatar);
        return this._avatarSubject;
    }
    get avatar() {
        return this._avatar || localStorage.getItem('avatar');
    }
    set avatar(val: string) {
        this._avatar = val;
        localStorage.setItem('avatar', val);
        if (this._avatarSubject) {
            this._avatarSubject.next(val);
        } else {
            this.initAvatarSubject();
        }
    }

    /**
     * Methods for forwarding users
     */
    toTrainingPlan(id: number) {
        const path = `${this.type}/${this._appPaths.training}/${this._appPaths.trainingPlanView}`;
        this.redirectUser(path, {id: id});
    }
}
