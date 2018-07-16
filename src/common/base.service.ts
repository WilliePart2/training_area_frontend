import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { UserManagerService } from './user.manager.service';
import { Observable } from 'rxjs/Observable';

@Injectable()

export class BaseService {
    constructor(
        protected userManager: UserManagerService,
        protected http: HttpClient
    ) { }
    generateHeaders(token) {
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        });
    }
    prepareRequest(callback) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return callback(headers);
            // .catch(error => {
            //     return Observable.of(false);
            // });
    }
}
