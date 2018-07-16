import { Component, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { MentorService } from '../../services/mentor.service';
import { UserManagerService } from '../../../common/user.manager.service';
import { MentorCacheService } from '../../services/mentor.cache.service';
import { PadawanService } from '../../services/padawan.service';
import { User } from '../../../common/models/user';

@Component({
    selector: 'app-padawan-from-mentor',
    templateUrl: './padawan.from.mentor.component.html'
})
export class PadawanFromMentorComponent extends ProtectedComponent implements OnInit {
    users: User [];
    /** Свойства для вывода ошибки */
    errorAccount: string;
    globalError = false;

    constructor(
        private mentor: MentorService,
        protected userManager: UserManagerService,
        private mentorCache: MentorCacheService,
        private padawanService: PadawanService
    ) {
        super(userManager);
    }

    ngOnInit() {
        this.initialize();
    }

    get page() {
        return this._page;
    }
    set page(pageNumber: number) {
        this._page = pageNumber;
        this.correctOffset();
        this.initialize();
    }

    initialize() {
        this.padawanService.getRequestFromMentor(this.offset, this.limit).subscribe(response => {
            const check = this.checkError(response,  'Ошибка соединения с сервером');
            this.userManager.reNewAccessToken(response['accessToken']);
            this.totalCount = response['data']['totalCount'];
            if (!check) { return; }
            this.mentorCache.inviteLearners = response['data'];
            this.users = this.mentorCache.inviteLearners;
            this.globalError = false;
        }, error => {
            this.errorMessage('Ошибка соединения с сервером');
            this.globalError = true;
        });
    }

    /** Метод отклонения запроса на связывание */
    resetBindRequest(client: User) {
        this.mentor.sendUnbindRequest(client.username).subscribe(response => {
            this.userManager.reNewAccessToken(response['accessToken']);
            /** Обработка ошибки */
            if ((response && response['result'] === false) || !response) {
                this.errorMessage('Ошибка соединения с сервером, запрос неудался');
                this.errorAccount = client.username;
                return;
            }

            this.mentorCache.removeInviteLearners(client);
            this.users = this.mentorCache.inviteLearners;
            this.resetErrorMessage();
        }, error => {
            this.errorMessage('Ошибка соединения с сервером, запрос не отправлен');
            this.errorAccount = client.username;
        });
    }
}
