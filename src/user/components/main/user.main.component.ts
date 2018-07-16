import { Component, OnInit } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-user-main',
    templateUrl: './user.main.component.html'
})

export class UserMainComponent extends ProtectedComponent implements OnInit {
    username: string;
    type: string;

    constructor(protected userManager: UserManagerService, private userService: UserService) {
        super(userManager);
    }

    ngOnInit() {
        console.log(this.userManager.username);
        this.username = this.userManager.username;
        this.type = this.userManager.type === 'mentor' ? 'Наставник' : 'Пользователь';
    }

    logout() {
        this.userService.logout().subscribe(response => {
            if (!response) {
                this.errorMessage('Ошибка соединения с сервером, повторите попытку позже');
                return;
            }
            this.userManager.redirectUser('');
            this.resetErrorMessage();
        });
    }
}
