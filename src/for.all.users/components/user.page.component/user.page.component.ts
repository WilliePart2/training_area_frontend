import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ProtectedComponent  } from '../../../common/components/protected.component';
import { UserManagerService } from '../../../common/user.manager.service';
import { UserPageDataService } from '../../services/user.page.data.service';
import { LabelService } from '../../../common/label.service';

import { EssentialUserDataModel } from '../../models/essential.user.data.model';
import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';


@Component({
    selector: 'app-user-page-component',
    templateUrl: './user.page.component.html',
    providers: [UserPageDataService]
})

export class UserPageComponent extends ProtectedComponent implements OnInit, OnDestroy {
    selfId: number;
    userId: number;
    mode: 'ownPage' | 'asideUserPage';
    essentialData: EssentialUserDataModel;
    idSubscription: Subscription;
    isInitialized: boolean;

    _dimmerLabels: DimmerLabels;
    _errorLabels: ErrorLabelsModel;

    isPostsLoaded: boolean;

    constructor(
        protected userManager: UserManagerService,
        private route: ActivatedRoute,
        private userDataService: UserPageDataService,
        private labelService: LabelService
    ) {
        super(userManager);
    }
    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];

        this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.getId()
            .flatMap(() => {
                return this.getEssentialUserData();
            })
            .subscribe(() => {
                this.isInitialized = true;
                if (this.isPostsLoaded) { this.disableDimmer(); }
            });
    }
    ngOnDestroy() {
        if (this.idSubscription) {
            this.idSubscription.unsubscribe();
        }
    }
    postsLoadedHandler() {
        console.log('post loading handler emited');
        this.isPostsLoaded = true;
        this.disableDimmer();
    }
    getId() {
        // this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
        this.selfId = parseInt(`${this.userManager.id}`, 10);
        return Observable.create(observer => {
            this.idSubscription = this.route.queryParams.subscribe(queryParams => {
                if (!this.dimmed) {
                    this.enableDimmer(this._dimmerLabels.STD_HTTP_DIMMER_MSG);
                }
                this.isPostsLoaded = false;
                /**
                 * I suppose that when id in query params changes we will load new posts
                */
                    if (queryParams && queryParams.id) {
                        this.userId = parseInt(queryParams.id, 10);
                        this.checkMode();
                        if (this.isInitialized) {
                            this.getEssentialUserData()
                                .subscribe(() => {
                                    if (this.isPostsLoaded) {
                                        this.disableDimmer();
                                    }
                                });
                        }
                    } else {
                        this.userId = this.userManager.id;
                        this.checkMode();
                    }
                    observer.next();
                    observer.complete();
            });
        });
    }
    getEssentialUserData() {
        return Observable.create(observer => {
            this.userDataService.getEssentialUserData(this.userId).subscribe(response => {
                this.checkResponse(response, resp => {
                    this.essentialData = resp['data'];
                    observer.next();
                    observer.complete();
                });
            }, error => {
                this.errorMessage(this._errorLabels.LOAD_USER_DATA_ERROR_MSG);
                observer.error();
            });
        });
    }
    checkMode() {
        if (this.selfId === this.userId) {
            this.mode = 'ownPage';
            return;
        }
        this.mode = 'asideUserPage';
    }
}
