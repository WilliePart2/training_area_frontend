import { Injectable } from '@angular/core';
import { UserManagerService } from './user.manager.service';

@Injectable()
export class UrlService {
    constructor(private userService: UserManagerService) {}

    /**
     * Basics path in application
     */
    getPaths() {
        
    }
    
    /** Базовые урлы */
    getServerUrl() {
        // return `${location.protocol}//127.0.0.2`;
        return `${location.protocol}//192.168.0.105`;
    }
    getSystem() {
        return `${this.getServerUrl()}/system`;
    }
    getMentorMainUrl() {
        return `${this.getServerUrl()}/mentor`;
    }
    getClientMainUrl() {
        return `${this.getServerUrl()}/user`;
    }

    /** common methods whitch use url wit relation to user type */
    getMessage() {
        return `${this.userService.type === 'mentor' ? this.getMentorMessage() : this.getClientMessage()}`;
    }
    getMainUrl() {
        return this.userService.type === 'mentor' ? this.getMentorMainUrl() : this.getClientMainUrl();
    }
    getUsersController() {
        return this.userService.type === 'mentor' ? this.getMentorUsersController() : this.getClientUsersController();
    }

    /** Урлы по компонентам(менторские) */
    getMentorTrainings() {
        return `${this.getMentorMainUrl()}/training`;
    }
    getMentorSetting() {
        return `${this.getMentorMainUrl()}/setting`;
    }
    getMentorUserPage() {
        return `${this.getMentorMainUrl()}/user-page`;
    }
    getMentorMessage() {
        return `${this.getMentorMainUrl()}/message`;
    }
    getMentorPadawans() {
        return `${this.getMentorMainUrl()}/padawan`;
    }
    getMentorUsersController() {
        return `${this.getMentorMainUrl()}/padawan`;
    }

    /** urls for simple users */
    getClientUsersController() {
        return `${this.getClientMainUrl()}/mentors`;
    }

    /** Урлы по компонентам(клиентские) */
    getClientUsers() {
        return `${this.getClientMainUrl}/users`;
    }
    /**
     * in method need amend sufix url with relation to url on server
     */
    getClientMessage() {
        return `${this.getClientMainUrl()}/messages`;
    }
}
