import { Directive, Input, ElementRef, OnInit } from '@angular/core';
import { User } from '../../common/models/user';

@Directive({
    selector: '[user]',
})

export class UserDirective implements OnInit {
    @Input() user: User;
    @Input() userData: any;

    constructor(private element: ElementRef) { }

    ngOnInit() {
        if (this.user) {
            if (this.user.type === 'mentor') {
                this.createMentorContent(this.user, this.element);
            } else {
                this.createSimpleUserContent(this.user, this.element);
            }
        }
    }

    createMentorContent(user: User, element: ElementRef) {
        element.nativeElement.innerHTML = `<div>
                <div>Количество подопечных: ${this.user.countPadawans}</div>
                <div>Количество созданых тренировочных планов: ${this.user.countTrainingPlans}</div>
            </div>`;
    }

    createSimpleUserContent(user: User, element: ElementRef) {
        element.nativeElement.innerHTML = `<div>
                <div>Количество пройденых тренировочных програм: ${user.trainings}</div>
                <div>Текущий наставник: ${user.mentor ? user.mentor : 'отсутствует'}</div>
            </div>`;
    }
}
