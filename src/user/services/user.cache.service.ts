import { Injectable } from '@angular/core';
import { StoreService } from '../../common/store.service';
import { User } from '../../common/models/user';

@Injectable()
export class UserCacheService {
    constructor( private store: StoreService ) { }

    /** Созраняет/Отдает объект ментора которому отправлен запрос */
    set requestedMentor(mentor: User) {
        this.store.insert('requestedMentor', mentor);
    }
    get requestedMentor() {
        return this.store.get('requestedMentor');
    }
    removeRequestedMentor() {
        this.store.remove('requestedMentor');
    }

    /** Сохраняет/Отдает объект текущего ментора */
    set currentMentor(mentor: User) {
        this.store.insert('currentMentor', mentor);
    }
    get currentMentor() {
        return this.store.get('currentMentor');
    }
    removeCurrentMentor() {
        this.store.remove('currentMentor');
    }

    /** Сохраняет/Отдает объект ментора от которого получено приглашение */
    set fromMentor(mentors: User []) {
        this.store.insert('fromMentor', mentors);
    }
    get fromMentor() {
        return this.store.get('fromMentor');
    }
    removeFromMentor(mentor: User) {
        const result = [];
        if (!this.fromMentor) { return; }
        this.fromMentor.forEach(item => {
            if (mentor.username === item.username) {
                return;
            }
            result.push(item);
        });
        return result;
    }
    addFromMentor(mentor: User) {
        return [...this.fromMentor, mentor];
    }

    /** Хэлпер для удаления объектов пользователей */
    filterMentos(mentors: User [], unwantedMentor: User) {
        const result = [];
        mentors.forEach(item => {
            if (item.username === unwantedMentor.username) {
                return;
            }
            result.push(item);
        });
        return result;
    }
}
