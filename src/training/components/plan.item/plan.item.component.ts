import {
    Component,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    ViewChild,
    AfterViewInit,
    AfterViewChecked,
    OnInit,
    OnDestroy,
    OnChanges,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    SimpleChanges
} from '@angular/core';
import { LogService } from '../../../common/log.service';

@Component({
    selector: 'plan-item',
    templateUrl: './plan.item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class PlanItemComponent implements AfterViewInit, OnInit, OnChanges {
    willDestroyed: boolean;
    @Input() mode: string;
    @Input() disableEditable: boolean;
    @Input() disableVisible: boolean;
    @Input() secondaryItem: any;
    @Input() editable: boolean;
    @Input() item: any;
    @Input() focus: boolean;
    @Output() focusOnItem = new EventEmitter();
    @Output() removeFocus = new EventEmitter();
    @Output() itemChange = new  EventEmitter();
    style = {
        height : '30px',
        paddingTop: '5px'
    };
    inFocus: boolean;
    @ViewChild('input') input: ElementRef;

    constructor(
        private loger: LogService,
        private cdr: ChangeDetectorRef
    ) {}
    ngAfterViewInit() {
        if (this.input && this.input.nativeElement) {
            this.input.nativeElement.onfocus = this.enableInFocus.bind(this);
            if (this.focus) {
                this.input.nativeElement.focus();
            } else {
                this.input.nativeElement.blur();
            }
        }
    }
    ngOnInit() {
        this.mode = this.mode ? this.mode : 'view';
        this.editable = false;
        this.disableEditable = this.disableEditable ? this.disableEditable : false;
        this.disableVisible = this.disableVisible ? this.disableVisible : false;
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes.focus && changes.focus.currentValue !== changes.focus.previousValue) {
            if (this.input) {
                if (changes.focus.currentValue === true) {
                    this.input.nativeElement.focus();
                    this.enableEditable();
                } else {
                    this.input.nativeElement.blur();
                    this.disableEditableMode();
                }
            }
        }
    }
    /** Метод передает данные из компонента */
    modelChangeHandler(data: string) {
        this.itemChange.emit(data);
    }
    /** Метод (обработчик mouseenter) включает режим редактирования */
    enableEditable() {
        if (!this.disableEditable) {
            this.editable = true;
        }
    }
    /** Метод (обработчик mouseleave) выключает режим редактирования */
    disableEditableMode() {
        if (!this.inFocus) {
            this.editable = false;
        }
    }
    /** Focus event handler */
    enableInFocus() {
        this.focusOnItem.emit();
        this.inFocus = true;
    }
    /** Blur event handler */
    disableInFocus() {
        this.inFocus = false;
    }
    /** Helpers */
    log(message: any, category = '') {
        if (category) {
            this.loger.log(message, category);
            return;
        }
        this.loger.log(message);
    }
}
