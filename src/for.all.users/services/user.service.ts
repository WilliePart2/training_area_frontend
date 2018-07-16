import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../common/base.service';
import { UserManagerService } from '../../common/user.manager.service';
import { UrlService } from '../../common/url.service';

@Injectable()
export class UserService extends BaseService {

    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private url: UrlService
    ) {
        super(userManager, http);
    }
    findUserByPartOfUsername(partUsername: string) {
        const whoSearched = this.userManager.type;
        let url = (whoSearched === 'mentor' ? this.url.getMentorPadawans() : this.url.getClientUsers());
        url += '/search-user-by-username' + '?unm=' + partUsername;
        return this.prepareRequest(headers => {
            return this.http.get(
                url,
                {headers}
            );
        });
    }
}
