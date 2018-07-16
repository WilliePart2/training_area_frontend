import {
    Component,
    Input,
    Output,
    OnInit,
    EventEmitter,
    AfterViewInit,
    ViewChildren,
    Renderer2,
    QueryList,
    ElementRef,
    ChangeDetectionStrategy, Inject, ViewChild, NgZone, ChangeDetectorRef, TemplateRef, OnDestroy
} from '@angular/core';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { take } from 'rxjs/operator/take';
import { IPadawanTrainingPlan } from '../../../mentor/models/padawan.model';
import {readMetadata} from '@angular/compiler-cli/src/transformers/metadata_reader';
import {Subscription} from 'rxjs/Subscription';

interface IColumns<KeyForData, Event> {
    [ColumnName: string]: KeyForData | Event;
}

interface IUniversalEvent {
    [eventName: string]: {
        name: string,
        data: any,
        icon: string
    };
}

interface IBodyData {
    id: number;
    data: any [];
}

class SpecialValues {
    constructor(
        public readme = 'readme'
    ) {}
}
type SpecialValuesKeys = Array<SpecialValues[keyof SpecialValues]>;

interface SpecialData {
    [k: string]: Array<string| number | boolean>;
}

interface SpecialDataFlags {
    [k: string]: boolean;
}

/**
 * This component create table for displaying data
 * necessary columns in data set:
 *  @id - used for optimize rerender and for emitting events
 * special columns which will be displayed not as string
 *  @rating - will be displayed as number of starts
 *  @readme - will be displayed as auxiliary text which will be sees only when mouse disposed over the element
 *  @action - this key declared action handler for which will be declared in all elements
 */
@Component({
    selector: 'app-listing-training-plan-view',
    templateUrl: './listing.training.plans.view.component.html',
    styleUrls: ['./listing.training.plans.view.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: 'Windows', useValue: window}
    ]
})
export class ListingTrainingPlansViewComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() trainingPlans: IPadawanTrainingPlan[];
    @Input() columns: IColumns<any, IUniversalEvent>;
    @Input() inverted: boolean;
    @Input() cursorPointer: boolean;
    @Input() rowLimit: number;
    @Input() minimalHeightToLoad: number;
    @Input() ratingStyle: string;
    @Output() action = new EventEmitter<number>();
    @ViewChildren('actionContainer') actionContainers: QueryList<ElementRef>;
    @ViewChild('tableContainer') tableContainer: ElementRef;
    @ViewChildren('readme', {read: ElementRef}) readmeContainers: QueryList<ElementRef>;
    headerData: string [];
    bodyData: Array<IBodyData>;
    hasRating: boolean;
    hasAction: boolean;
    ratingValue: number [];
    actionValue: string [];

    minimalHeightRemembers: number;
    rowPortion: number;
    lastIndex: number;
    /**
     * values which will represent specials actions or UI elements
     */
    _spValNames: SpecialValues;
    specialValues: SpecialValuesKeys;
    specialValuesContainer: SpecialData = {};
    hasSpecialValues: SpecialDataFlags = {};

    actionSub: Subscription;
    readmeSub: Subscription;
    scrollSub: Subscription;

    constructor(
        private _renderer: Renderer2,
        @Inject('Window') private _window,
        private zone: NgZone,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        /**
         * setting default values for important data
         * @minimalHeightRemembers - represent minimal gap to begin loading new rows
         * @rowPortion - represent count rows which will be displayed immediately and how match new rows will be loaded
         * @ratingStyle - define class which will be added to rating component
         * @type {number}
         */
        this.minimalHeightRemembers = this.minimalHeightToLoad ? this.minimalHeightToLoad : 50;
        this.rowPortion = this.rowLimit ? this.rowLimit : 15;
        this.ratingStyle = this.ratingStyle ? this.ratingStyle : 'star';

        /**
         * setting special values
         */
        this._spValNames = new SpecialValues();
        this.specialValues = [
            this._spValNames.readme
        ];

        /**
         * load main data from array
         */
        if (this.trainingPlans && this.columns) {
            this.loadRows();
            this.cdr.detectChanges();
        }
    }

    ngAfterViewInit() {
        /**
         * attach actions to correspond cells
         */
        if (this.actionContainers) {
            this.actionContainers.forEach(container => {
                /**
                 * Here will be universal action handler
                 */
            });
        }

        /**
         * attache scroll event handler for dynamic load rows
         */
        if (this.tableContainer && !this.scrollSub) {
            this.zone.onMicrotaskEmpty.asObservable().take(1).subscribe(_ => {
                this.initDynamicLoad(this.tableContainer.nativeElement, [
                    'content',
                    'scrolling'
                ]);
            });
        }

        /**
         * insert readme to elements
         */
        if (this.readmeContainers) {
            this.readmeSub = this.readmeContainers.changes.subscribe((list: QueryList<ElementRef>) => {
                list.forEach((elt: ElementRef, index: number) => {
                    if (this.specialValuesContainer[this._spValNames.readme] ) {
                        if (this.specialValuesContainer[this._spValNames.readme][index] !== null) {
                            this.fillReadme(elt.nativeElement, this.specialValuesContainer[this._spValNames.readme][index] as string);
                        }
                    }
                });
            });
        }
    }

    ngOnDestroy() {
        if (this.scrollSub) { this.scrollSub.unsubscribe(); }
        if (this.readmeSub) { this.readmeSub.unsubscribe(); }
    }

    getMainData(columns: IColumns<any, IUniversalEvent>, trainingPlans: IPadawanTrainingPlan [], specialValues?: SpecialValuesKeys) {
        let columnKeys = [];
        const bodyData = [];
        const specialValuesData: SpecialData = {};
        const hasSpecialValues: SpecialDataFlags  = {};

        /**
         * receiving column names and filtering special values
         */
        columnKeys = Object.keys(columns);
        if (specialValues && specialValues.length) {
            columnKeys = columnKeys.filter(columnItem => !specialValues.find(spItem => spItem === columnItem));
        }
        /**
         * bind column name with corresponding data
         */
        let stop = false;
        let latestHandledIndex;
        const indexSnapshot = this.lastIndex;
        trainingPlans.forEach((dataItem: IPadawanTrainingPlan, index: number) => {
            if (stop) { return; }

            const rowNumber = index - (indexSnapshot || 0);

            if (indexSnapshot !== undefined) {
                if (index <= indexSnapshot) {
                    return;
                }
            }

            /**
             * getting special data
             */
            if (specialValues && specialValues.length) {
                specialValues.forEach(spKey => {
                    const specialData = dataItem[spKey];
                    let dataForInsert = null;
                    if (!specialValuesData[spKey] || !specialValuesData[spKey].length) {
                        specialValuesData[spKey] = [];
                    }

                    if (specialData) {
                        dataForInsert = specialData;
                        hasSpecialValues[spKey] = true;
                    } else {
                        hasSpecialValues[spKey] = false;
                    }

                    specialValuesData[spKey].push(dataForInsert);
                });
            }

            /**
             * getting main data
             */
            const tmpData = [];
            columnKeys.forEach(keyItem => {
                if (columns[keyItem] === 'rating') {
                    if (this.ratingValue === undefined) {
                        this.ratingValue = [];
                    }
                    this.hasRating = true;
                    this.ratingValue.push(dataItem[columns[keyItem]]);
                    return;
                }

                if (columns[keyItem] === 'action') {
                    if (this.actionValue === undefined) {
                        this.actionValue = [];
                    }
                    this.hasAction = true;
                    this.actionValue.push(dataItem[columns[keyItem]]);
                    return;
                }

                tmpData.push(dataItem[columns[keyItem]]);
            });

            bodyData.push({
                id: dataItem.id,
                data: tmpData
            });

            if (rowNumber >= this.rowPortion) {
                stop = true;
            }

            latestHandledIndex = index;
        });
        this.lastIndex = latestHandledIndex ? latestHandledIndex : this.lastIndex;

        return {
            bodyData,
            headerData: columnKeys,
            specialValuesData,
            hasSpecialValues
        };
    }

    emitEvent(rowId: number) {
        this.action.emit(rowId);
    }

    bodyRowTracker(index: number, item: IBodyData) {
        return item.id;
    }
    initDynamicLoad(element: HTMLElement, className: string | string []) {
        const container = this.getParentNode(element, className);
        if (container) {
                this.scrollSub = fromEvent(container, 'scroll').subscribe((event: Event) => {
                    const viewHeight = container.clientHeight;
                    const contentHeight = container.scrollHeight;
                    if ((contentHeight - (viewHeight + container.scrollTop)) < this.minimalHeightRemembers) {
                        this.loadRows();
                    }
                });
        }

    }
    getParentNode(element: HTMLElement, className: string | string []) {
        let result = null;
        if (!Array.isArray(className)) {
            className = [className];
        }
        for (let elt = element; elt.parentNode !== null; elt = elt.parentElement) {
            let isEqual = true;
            className.forEach(classItem => {
                if (!elt.classList.contains(classItem)) {
                    isEqual = false;
                }
            });
            if (isEqual) {
                result = elt;
                break;
            }
        }
        return result;
    }
    loadRows() {
        const { bodyData, headerData, specialValuesData, hasSpecialValues } = this.getMainData(this.columns, this.trainingPlans, this.specialValues);
        /**
         * adding special data
         */
        if (this.specialValuesContainer) {
            const containerKeys = Object.keys(specialValuesData);
            containerKeys.forEach(key => {
                if (this.specialValuesContainer[key]) {
                    this.specialValuesContainer[key] = [...this.specialValuesContainer[key], ...specialValuesData[key]];
                } else {
                    this.specialValuesContainer[key] = specialValuesData[key];
                }
            });
        } else {
            this.specialValuesContainer = specialValuesData as SpecialData;
        }
        /**
         * adding special data flags
         */
        if (this.hasSpecialValues) {
            const flagKeys = Object.keys(hasSpecialValues);
            flagKeys.forEach(key => {
                if (this.hasSpecialValues[key]) { return; }
                this.hasSpecialValues[key] = hasSpecialValues[key];
            });
        } else {
            this.hasSpecialValues = hasSpecialValues;
        }

        /**
         * adding main data
         */
        if (bodyData && bodyData.length) {
            this.bodyData = this.bodyData ? [...this.bodyData, ...bodyData] : [...bodyData];
            this.cdr.detectChanges();
        }
        if (!this.headerData) {
            this.headerData = headerData;
        }
    }

    fillReadme(element: HTMLElement, readmeText: string) {
        const readmeContainer = element;
        this._renderer.addClass(readmeContainer, 'table-item');
        this._renderer.addClass(readmeContainer, 'tr-readme');
        if (this.inverted) {
            this._renderer.addClass(readmeContainer, 'tr-readme--light');
        } else {
            this._renderer.addClass(readmeContainer, 'tr-readme--dark');
        }
        const readmeContent = this._renderer.createText(readmeText);
        this._renderer.appendChild(readmeContainer, readmeContent);
    }
}
