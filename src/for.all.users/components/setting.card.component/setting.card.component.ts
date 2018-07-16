import { Component, OnInit, ViewChild, ApplicationRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { SettingService } from '../../services/setting.service';
import { SuiModalService, ModalTemplate, TemplateModalConfig } from 'ng2-semantic-ui';

export interface IAvatarsContext {
    list: string[];
}

@Component({
    selector: 'app-setting-card-component',
    templateUrl: './setting.card.component.html',
    providers: [SettingService, SuiModalService]
})
export class SettingCardComponent extends ProtectedComponent implements OnInit {
    avatar: string;
    avatars: string [];
    @ViewChild('chooseAvatar') avatarsModal: ModalTemplate<IAvatarsContext, any, any>;
    constructor(
        protected userManager: UserManagerService,
        private settingService: SettingService,
        private suiService: SuiModalService,
        private app: ApplicationRef
    ) {
        super(userManager);
    }
    ngOnInit() {
        this.avatar = this.userManager.avatar;
    }
    beginChangeAvatar() {
        this.enableDimmer('Загрузка данных...');
        const errorMessage = 'Ошибка соединения с сервером, данные не получены!';
        this.settingService.getAvatarList().subscribe(response => {
            this.checkResponse(response, resp => {
                this.avatars = resp['data'];
                const config = new TemplateModalConfig<IAvatarsContext, any, any>(this.avatarsModal);
                config.context = {
                    list: this.avatars
                };

                this.disableDimmer();
                this.suiService.open(config)
                    .onApprove((avatarUrl: string) => {
                        this.setAvatarAsCurrent(avatarUrl).subscribe(() => {
                            this.userManager.avatar = avatarUrl;
                            this.avatar = avatarUrl;
                            this.app.tick();
                        }, error => {
                            this.errorMessage(errorMessage);
                        });
                    })
                    .onDeny(() => {});
            });
        }, error => {
            this.errorMessage(errorMessage);
        });
        // Показать пользователю окошко для выбора

        // Сохранить аватар на сервере
    }
    setAvatarAsCurrent(avatarUrl: string) {
        return Observable.create(observer => {
            this.settingService.setAvatar(avatarUrl).subscribe(response => {
                this.checkResponse(response, resp => {
                    observer.next();
                    observer.complete();
                });
            }, error => {
                observer.error();
            });
        });
    }
}
