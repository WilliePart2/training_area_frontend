import { Directive, ElementRef, OnInit, Input } from '@angular/core';
import { BasePlanItemModel } from '../models/base.plan.item.model';

@Directive({
    selector: '[exercise-row]',
})

export class ExerciseItemDirective implements OnInit {
    @Input('exercise-row') item;
    @Input() mode: string;
    constructor(private elt: ElementRef) {}

    ngOnInit() {
        const bardenHtml = `
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        `;
        const trainingHtml = `
            <td></td>
            <td></td>
            <td></td>
        `;
        const oldHtml: string = this.elt.nativeElement.innerHTML || '';
        const newHtml: string = `
            <td>
                <plan-item [(item)]="item.weight" [mode]="mode">
            </td>
            <td>{{item.repeats}}</td>
            <td>${this.item.repeatSection}</td>
            ${this.mode === 'view' || this.mode === 'edit' ? bardenHtml: trainingHtml}
        `;
        this.elt.nativeElement.innerHTML = oldHtml + newHtml;
    }
}
