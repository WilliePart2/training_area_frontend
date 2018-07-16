import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
    selector: '[group-mark]'
})
export class GroupMarkDirective implements OnInit {
    hasInit = false;
    @Input() trainingIndex: number;
    @Input() microcicleIndex: number;
    _pearStore: any;
    @Input() set pearsStore(items) {
        this._pearStore = items;
        if (this.hasInit) {
            this.initialize();
        }
    }
    get pearsStore() {
        return this._pearStore;
    }
    @Input() bgColors: any;
    constructor(private element: ElementRef) {}
    ngOnInit() {
        this.hasInit = true;
        this.initialize();
    }
    initialize() {
        let hasActive = false;
        let index = 0;
        this.pearsStore.forEach((storeItem, storeIndex) => {
            if (hasActive) { return; }
            storeItem.forEach(pearItem => {
                if (pearItem && pearItem.microcicleIndex === this.microcicleIndex && pearItem.trainingIndex === this.trainingIndex) {
                    hasActive = true;
                    index = storeIndex;
                }
            });
        });
        if (hasActive) {
            this.element.nativeElement.style.backgroundColor = this.bgColors[index];
        } else {
            this.element.nativeElement.style.backgroundColor = 'transparent';
        }
    }
}
