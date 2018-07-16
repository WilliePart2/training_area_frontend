/**
 * This component used for all type of users
 */
import { Component, OnInit } from '@angular/core';
import { UserManagerService } from '../../../common/user.manager.service';
import { PadawanService } from '../../services/padawan.service';
import { UrlService } from '../../../common/url.service';
import { Padawan } from '../../models/padawan';
import { LabelService } from '../../../common/label.service';

import { LABEL_GROUP_NAMES } from '../../../common/models/label.group.names';
import { PadawanCommonLabels } from '../../../common/models/padawans.common.labels';
import { ErrorLabelsModel } from '../../../common/models/error.labels.model';
import { DimmerLabels } from '../../../common/models/dimmer.labels.model';
import {AppService} from '../../../common/app.service';

@Component({
    selector: 'app-padawan',
    templateUrl: './padawan.component.html',
    styleUrls: ['./padawan.component.css'],
    providers: [PadawanService, UrlService]
})

export class PadawanComponent implements OnInit {
    padawans: Padawan[] = [];
    userType: 'mentor' | 'user';

    mainLink: string [];
    allUsersLink: string [];
    invitedUserLinks: string [];
    requestedUsersLinks: string [];

    _commonLabels: PadawanCommonLabels;
    _errorLabels: ErrorLabelsModel;
    _dimmerLabels: DimmerLabels;

    constructor(
        private userManager: UserManagerService,
        private padawanService: PadawanService,
        private labelService: LabelService,
        private appService: AppService
    ) { }

    ngOnInit() {
        const labels = this.labelService.getLabels();
        this._commonLabels = labels[LABEL_GROUP_NAMES.PADAWAN_COMMON_LABELS];
        this._errorLabels = labels[LABEL_GROUP_NAMES.ERROR_LABELS];
        this._dimmerLabels = labels[LABEL_GROUP_NAMES.DIMMER_LABELS];

        this.padawanService.getOwnPadawanList(0, 10).subscribe(response => console.log(response));

        this.userType = this.userManager.type;

        const routes = this.appService.getUsersPath();
        const mainPart = this.userType;
        const secondPart = this.userType === UserManagerService.MENTOR ? routes.padawans : routes.mentors;
        this.mainLink = ['/', mainPart, secondPart];
        this.allUsersLink = ['/', mainPart, secondPart, routes.allUsers];
        this.invitedUserLinks = ['/', mainPart, secondPart, routes.invitedUsers];
        this.requestedUsersLinks = ['/', mainPart, secondPart, routes.requestUsers];
    }
}
