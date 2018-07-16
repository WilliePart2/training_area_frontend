import { Directive, OnInit, OnChanges, ElementRef, Input } from '@angular/core';
import { User } from '../models/user';

@Directive({
    selector: '[userType]'
})

export class UserTypeDirective implements OnInit, OnChanges {
    @Input() userType: string;

    constructor(private element: ElementRef) { }

    ngOnInit() {
        this.getReadableUserType();
    }
    ngOnChanges() {
        this.getReadableUserType();
    }
    getReadableUserType() {
        if (this.userType && this.userType === 'mentor') {
            this.element.nativeElement.innerHTML = '<div>Наставник</div>';
        } else {
            this.element.nativeElement.innerHTML = '<div>Рядовой пользователь</div>';
        }
    }
}
