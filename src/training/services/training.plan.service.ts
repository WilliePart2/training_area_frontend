import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../common/url.service';
import { UserManagerService } from '../../common/user.manager.service';
import { Observable } from 'rxjs/Observable';
import { BaseService } from '../../common/base.service';
import 'rxjs/add/operator/map';
import { MicrocicleModel } from '../models/microcicle.model';
import { EditExerciseModel } from '../models/edit.exercise.model';
import { LayoutExerciseModel } from '../models/layout.exercise.model';

import { PlanHandleInterface } from '../models/plan.handle.interface';

@Injectable()
export class TrainingPlanService extends BaseService implements PlanHandleInterface {

    constructor(
        protected http: HttpClient,
        private urlService: UrlService,
        protected userManager: UserManagerService
    ) {
        super(userManager, http);
    }

    /** Загружаем список тренировочных планов */
    loadListingOwnTrainingPlans(offset: number, limit: number, id: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/index?offset=${offset}&limit=${limit}&id=${id}`,
                {headers}
            ).map(item => {
                const trainingData = item['trainingData'].map(trainingItem => {
                    let category = {
                        color: 'grey',
                        value: 'Без категории'
                    };
                    switch (trainingItem['category']) {
                        case 1: category = {color: 'green', value: 'Для новичков'}; break;
                        case 2: category = {color: 'blue', value: 'Для среднего уровня'}; break;
                        case 3: category = {color: 'violet', value: 'Для высокого уровня'}; break;
                    }

                    return {
                        ...trainingItem,
                        category: category
                    };
                });
                return {...item, trainingData};
            });
        });
    }

    /** Загружаем список тренировочных упражнений */
    loadExerciseList() {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.get(`${this.urlService.getMentorTrainings()}/get-exercise-list`, {headers})
            .catch(error => {
                return Observable.of({result: false, data: null});
            });
    }

    /** Сохраняем тренировочный план на сервер(новосозданый тренировочный план) */
    saveTrainingPlan(data) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
        }
        const headers = this.generateHeaders(token);
        return this.http.post(
            `${this.urlService.getMentorTrainings()}/training-plan-create`,
            {
                TrainingPlanManager: data
            },
            {headers}
        );
    }

    /** Удаляем тренировочный план */
    removeTrainingPlan(id: string) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.post(
            `${this.urlService.getMentorTrainings()}/invalidate-training-plan`,
            {
                TrainingPlanManager: {id}
            },
            {headers}
        );
    }

    /** Загружаем данные о тренировочном плане */
    loadTrainingPlanData(id: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/load-training-plan-data?id=${id}`,
                {headers},
            ).map(item => {
                let category = 'Без категории';
                switch (item['data']['category']) {
                    case 1: category = 'Для новичков'; break;
                    case 2: category = 'Для среднего уровня'; break;
                    case 3: category = 'Для высокого уровня'; break;
                }
                return {
                    ...item,
                    data: {
                        ...item['data'],
                        category
                    }
                };
            });
        });
    }

    /** Загружает шаблон упражнений для тренировочного плана */
    loadBaseLayout(id: number) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.get(
            `${this.urlService.getMentorTrainings()}/load-base-layout-for-training-plan?id=${id}`,
            {headers}
        );
    }

    /** Добавляет новые упражнения в тренировочный план */
    addExerciseToBaseLayout(planId: number, data: EditExerciseModel []) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.post(
            `${this.urlService.getMentorTrainings()}/add-exercise-to-layout`,
            {
                ExerciseManager: {
                    id: planId,
                    data
                }
            },
            {headers}
        );
    }

    /** Удаляет упражнений из тренировочного плана */
    deleteExerciseFromBaseLayout(planId: number, data: LayoutExerciseModel []) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.post(
            `${this.urlService.getMentorTrainings()}/delete-exercise-from-layout`,
            {
                ExerciseManager: {
                    id: planId,
                    data
                }
            },
            {headers}
        );
    }

    /** Метод обновляет тренировочный план на сервере (для режима редактирования) */
    updateTrainingPlan(planId: number, data: MicrocicleModel [], dataForDelete: any) {
        const token = this.userManager.accessToken;
        if (!token) {
            this.userManager.reloginUser();
            return Observable.of(false);
        }
        const headers = this.generateHeaders(token);
        return this.http.post(
            `${this.urlService.getMentorTrainings()}/update-training-plan`,
            {
                TrainingPlanManager: {
                    id: planId,
                    dataForInsert: data,
                    dataForDelete
                }
            },
            {headers}
        );
    }

    /** Метод загружает текущий тренировочный план пользователя */
    loadCurrentTrainingPlan(padawanId?: number) {
        return this.prepareRequest(headers => {
            const queryParams = padawanId ? `?pId=${padawanId}` : '';
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/load-current-training-plan${queryParams}`,
                {headers}
            );
        });
    }
    /** Метод для отметки тренировочного плана как собственного */
    setTrainingPlanAsCurrent(planId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/set-training-plan-as-current`,
                {
                    TrainingPlanManager: {
                        id: planId
                    }
                },
                {headers}
            );
        });
    }
    /** Метод для отметки тренировочного плана как завершенного */
    setTrainingPlanAsComplete(planId: number, trainingSessionId: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/set-training-plan-as-complete`,
                {
                    TrainingPlanManager: {
                        id: planId,
                        sessionId: trainingSessionId
                    }
                },
                {headers}
            );
        });
    }
    /** Метод загружает выполненые тренировочные планы пользователя */
    loadCompletedTrainingPlans() {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/get-completed-training-plans`,
                {headers}
            ).map(item => {
                return {
                    ...item,
                    data: item['data'].map(dataItem => {
                        return {
                            ...dataItem,
                            category: this.getReadableCategoryValue(item['category'])
                        };
                    })
                };
            });
        });
    }
    /** Метод загружает раскладки выполненые пользователем для тренировочного плана */
    loadCompletedPlan(planId: number, trainingSessionId: string, padawanId?: number) {
        return this.prepareRequest(headers => {
            const queryString = `?id=${planId}&tSession=${trainingSessionId}${padawanId ? `&pId=${padawanId}` : ''}`;
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/get-completed-training-plan${queryString}`,
                {headers}
            );
        });
    }
    /** Метод отправляет на сервер раскладки выполненые пользователем */
    saveCompletedExercisePlans(plans: any, completedTrainingId: number, planId: number, trainingSessionId: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/set-training-as-complete`,
                {
                    MicrocicleTrainingManager: {
                        id: planId,
                        trainingId: completedTrainingId,
                        plans,
                        sessionId: trainingSessionId
                    }
                },
                {headers}
            );
        });
    }
    /** Метод устанавливает микроцикл как завершенный */
    setMicrocicleAsCompleted(planId: number, microcicleId: number, trainingSessionId: string) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/set-microcicle-as-complete`,
                {
                    MicrocicleManager: {
                        planId,
                        microcicleId,
                        sessionId: trainingSessionId
                    }
                },
                {headers}
            );
        });
    }

    getSearchResult(
        searchParams: {name?: string, category?: number, type: 'mentorName' | 'planName' },
        offset: number,
        limit: number
    ) {
        return  this.prepareRequest(headers => {
            let queryParams = `offset=${offset}&limit=${limit}&type=${searchParams.type}`;
            if (searchParams.name) {
                queryParams += `&name=${searchParams.name}`;
            }
            if (searchParams.category) {
                queryParams += `&category=${searchParams.category}`;
            }
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/get-search-result${queryParams ? `?${queryParams}` : ''}`,
                {headers}
            ).map(response => {
                if (response['data']['mainData'] && response['data']['mainData']) {
                    response['data']['mainData'] = response['data']['mainData'].map(mainDataItem => {
                        return {
                            ...mainDataItem,
                            category: this.getReadableCategoryValue(mainDataItem['category'])
                        };
                    });
                }
                return response;
            });
        });
    }
    /** Метод для получения рейтинга тренировоного плана */
    getRating(planId: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.urlService.getMentorTrainings()}/get-training-plan-rating?planId=${planId}`,
                {headers}
            );
        });
    }
    setRating(trainingPlanId: number, value: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.urlService.getMentorTrainings()}/set-rating-for-training-plan`,
                {
                    TrainingPlanManager: {
                        id: trainingPlanId,
                        rating: value
                    }
                },
                {headers}
            );
        });
    }

    /** Helpers */
    getReadableCategoryValue(category: number) {
        let cat: 'Без категории' | 'Для новичков' | 'Для среднего уровня' | 'Для высокого уровня' = 'Без категории';
        switch (category) {
            case 1: cat = 'Для новичков'; break;
            case 2: cat = 'Для среднего уровня'; break;
            case 3: cat = 'Для высокого уровня'; break;
        }
        return cat;
    }
}
