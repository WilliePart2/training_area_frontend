import { Injectable } from '@angular/core';
import { StoreService } from '../../common/store.service';
import { User } from '../../common/models/user';

@Injectable()

export class MentorCacheService {
    constructor(private store: StoreService) { }

    /** Сохранение/Получение текущих учениеков */
    set ownLearners(learners: User []) {
        this.store.insert('ownLearners', learners);
    }
    get ownLearners() {
        return  this.store.get('ownLearners');
    }
    addOwnLearner(learner: User) {
        this.ownLearners = [...this.ownLearners, learner];
    }
    removeOwnLearner(learner: User) {
        this.ownLearners = this.filterLearners(this.ownLearners, learner);
    }

    /** Сохранение/Получение учеников которым отправлен запрос */
    set inviteLearners(learners: User []) {
        this.store.insert('inviteLearners', learners);
    }
    get inviteLearners() {
        return this.store.get('inviteLearners');
    }
    addInviteLearners(learner: User) {
        this.inviteLearners = [...this.inviteLearners, learner];
    }
    removeInviteLearners(learner: User) {
        this.inviteLearners = this.filterLearners(this.inviteLearners, learner);
    }

    /** Сохранение/Получение учеников от которых получен запрос */
    set incomingLearners(learners: User []) {
        this.store.insert('incomingLearners', learners);
    }
    get incomingLearners() {
        return this.store.get('incomingLearners');
    }
    addIncomingLearners(learner: User) {
        this.incomingLearners = [...this.incomingLearners, learner];
    }
    removeIncomingLearners(learner: User) {
        this.incomingLearners = this.filterLearners(this.incomingLearners, learner);
    }

    /** Хэлперы */
    filterLearners(learners: User [], unwantedLearner: User) {
        const result = [];
        learners.forEach(item => {
            if (item.username === unwantedLearner.username) { return; }
            result.push(item);
        });
        return result;
    }
}