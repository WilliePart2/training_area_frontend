import {Injectable} from '@angular/core';
import {BasicPathModel} from './models/basic.path.model';
import {UsersPathModel} from './models/users.path';

@Injectable()
export class AppService {
    private _appPaths: BasicPathModel;
    private _usersPath: UsersPathModel;

    constructor() {
        this._appPaths = new BasicPathModel();
        this._usersPath = new UsersPathModel();
    }
    getAppPath() {
        return this._appPaths;
    }
    getUsersPath() {
        return this._usersPath;
    }
}
