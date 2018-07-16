import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { UserManagerService } from './user.manager.service';
import { HttpClient } from '@angular/common/http';
import {IImageModel} from './models/image.model';
import {UrlService} from './url.service';

@Injectable()
export class ImageService extends BaseService {
    images: IImageModel [] = [];
    constructor(
        protected http: HttpClient,
        protected userManager: UserManagerService,
        private url: UrlService
    ) {
        super(userManager, http);
        this.init();
    }
    init() {
        this.prepareRequest(headers => {
            this.http.get(this.url.getSystem() + '/get-image-set').subscribe(response => {
                if (response) {
                    this.images = response as IImageModel[];
                }
            }, error => {}); 
        });
    }
    getImage(name: string) {
        return this.images.find(image => image.name === name);
    }
    getImagePath(name: string) {
        const image = this.getImage(name);
        return image ? image.path : null;
    }
}
