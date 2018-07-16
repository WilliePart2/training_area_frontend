import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { refCount } from 'rxjs/operators';
import { Map, List } from 'immutable';

@Component({
    selector: 'app-index-main',
    templateUrl: './index.main.component.html'
})

export class IndexMainComponent {}
