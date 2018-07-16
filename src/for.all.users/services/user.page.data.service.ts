import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../common/base.service';
import { UserManagerService } from '../../common/user.manager.service';
import { UrlService } from '../../common/url.service';
import 'rxjs/add/operator/map';

@Injectable()
export class UserPageDataService extends BaseService {
    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private url: UrlService
    ) {
        super(userManager, http);
    }
    getEssentialUserData(userID: number) {
        return this.prepareRequest(headers => {
            return this.http.get(
                `${this.url.getMentorUserPage()}/get-essential-user-data?uid=${userID}`,
                {headers}
            ).map(response => {
                let init = false;
                const resultObj = {};
                const handleContactFieldId = [];
                const handleRelationUserId = [];
                if (!response['result']) { return response; }
                response['data'].forEach(dataItem => {
                    if (!init) {
                        resultObj['id'] = parseInt(dataItem['id'], 10);
                        resultObj['username'] = dataItem['username'];
                        resultObj['type'] = dataItem['type'];
                        resultObj['avatar'] = dataItem['avatar'];
                        resultObj['rating'] = parseInt(dataItem['rating'], 10);
                        resultObj['followedId'] = dataItem['followed_id'];
                        init = true;
                    }
                    /** selecting not enpty contact fields */
                    if (handleContactFieldId.indexOf(dataItem['identifier']) === -1 && dataItem['contact_value']) {
                        const objForInsert = {
                            identifier: dataItem['identifier'],
                            label: dataItem['contact_label'],
                            group: dataItem['contact_group'],
                            icon: dataItem['contact_icon'],
                            value: dataItem['contact_value'],
                            recordId: dataItem['field_value_id']
                        };
                        if (resultObj['contacts'] === undefined) {
                            resultObj['contacts'] = [objForInsert];
                        } else {
                            resultObj['contacts'].push(objForInsert);
                        }
                        handleContactFieldId.push(dataItem['identifier']);
                    }
                    /** select related users */
                    if (dataItem['relation_user_id'] && handleRelationUserId.indexOf(dataItem['relation_user_id'])) {
                        const userObj = {
                            id: dataItem['relation_user_id'],
                            username: dataItem['relation_username'],
                            type: dataItem['relation_user_type'],
                            avatar: dataItem['relation_user_avatar']
                        };
                        if (resultObj['relations'] === undefined) {
                            resultObj['relations'] = [userObj];
                        } else {
                            resultObj['relations'].push(userObj);
                        }
                        handleRelationUserId.push(dataItem['relation_user_id']);
                    }
                });
                return {
                    data: resultObj,
                    result: response['result'],
                    accessToken: response['accessToken']
                };
            });
        });
    }
    addContactField(store: object, ) {

    }
    getUserPosts() {

    }
    toggleFollowing(followedId: number, followerId: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorUserPage()}/toggle-following-user`,
                {
                    followedId,
                    followerId
                },
                {headers}
            );
        });
    }
    setUserRating(evaluateUserId: number, ratingValue: number) {
        return this.prepareRequest(headers => {
            return this.http.post(
                `${this.url.getMentorUserPage()}/set-user-rating`,
                {
                    evaluateUserId,
                    ratingValue
                },
                {headers}
            );
        });
    }
}
