import { Injectable } from '@angular/core';
import { BaseService } from '../../common/base.service';
import { CacheService } from '../../common/cache.service';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../common/url.service';
import { UserManagerService } from '../../common/user.manager.service';
import { LogService } from '../../common/log.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import {IPadawanModel, IPadawanTrainingPlan} from '../../mentor/models/padawan.model';

@Injectable()
export class PadawanService extends BaseService {
    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private urlService: UrlService,
        private logService: LogService,
        private cache: CacheService
    ) {
        super(userManager, http);
    }
    /** Метод для получения списка собственных подопечных */
    getOwnPadawanList(offset: number = 0, limit: number = 10) {
        const url = `${this.urlService.getMentorMainUrl()}/padawan/get-own-padawans?offset=${offset}&limit=${limit}`;
        /** Получаем данные из сервера */
        const token = this.userManager.accessToken;
        if (token) {
            const headers = this.generateHeaders(token);
            return this.http.get(url, {headers: headers})
                .map(response => {
                    console.log(response);
                    let resp;
                    // this.cache.add(url, response['data']);
                    resp = {
                            ...response['data'],
                            padawans: response['data']['padawans'].map((padawanItem: IPadawanModel) => {
                                return {
                                    ...padawanItem,
                                    trainings: {
                                        completedPlans: padawanItem['trainings']['completedPlans'].map(completeItem => {
                                            return {
                                                ...completeItem,
                                                category: this.getReadableCategory(completeItem['category'] as number)
                                            };
                                        }),
                                        currentPlan: ((planItem: IPadawanTrainingPlan) => {
                                            if (!planItem) {
                                                return null;
                                            }
                                            return {
                                                ...planItem,
                                                category: this.getReadableCategory(planItem.category as number)
                                            };
                                        })(padawanItem['trainings']['currentPlan'])
                                    }
                                };
                            })
                        };
                    resp['accessToken'] = response['accessToken'];
                    resp['result'] = response['result'];
                    console.log(resp);
                    return resp;
                });
        } else {
            this.userManager.reloginUser();
            return Observable.of(false/* Заглушка */);
        }
    }
    appointTrainingPlanToPadawan(padawanId: number, trainingPlanId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorMainUrl()}/padawan/appoint-training-plan-to-padawan`,
                {
                    TrainingPlanManager: {
                        padawanId,
                        id: trainingPlanId
                    }
                },
                {headers}
            );
        });
    }
    /**
     * Метод для получение списка всех пользователей
     */
    getAllUsersList(offset: number, limit: number) {
        const url = `${this.urlService.getUsersController()}/get-users-list?offset=${offset}&limit=${limit}`;
        return this.prepareRequest(_headers => {
            return this.http.get(url, {headers: _headers});
        });
    }

    /**
     * Метод возвращает запросы пришедшие к ментору
     */
    getRequestToMentor(offset, limit) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorMainUrl()}/padawan/get-request-from-users?offset=${offset}&limit=${limit}`,
                {
                    headers
                }
            );
        });
    }

    /**
     * Метод возвращает запросы отправленые ментором
     */
    getRequestFromMentor(offset: number, limit: number) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.get(
            `${this.urlService.getMentorMainUrl()}/padawan/get-request-from-mentor?offset=${offset}&limit=${limit}`,
            {headers}
        )
            .catch(error => {
                return Observable.of(false);
            });
    }

    getReadableCategory(category: number) {
        let result = 'Без категории';
        switch (category) {
            case 1: result = 'Для новичков'; break;
            case 2: result = 'Для среднего уровня'; break;
            case 3: result = 'Для высокого уровня'; break;
        }
        return result;
    }
    // private generateHeaders(token: string) {
    //     return new HttpHeaders({
    //         'Accept': 'application/json',
    //         'Authorization': `Bearer ${token}`
    //     });
    // }
}
