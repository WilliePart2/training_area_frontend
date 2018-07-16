import { Injectable } from '@angular/core';

@Injectable()
export class LogService {
    log(message: any, group: string = '') {
        if(group) console.group(group);
        console.log(message);
        if(group) console.groupEnd();
    }
    errorLog(message) {

    }
}