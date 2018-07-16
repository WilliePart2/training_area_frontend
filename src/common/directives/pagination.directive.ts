import { Directive, OnInit, ElementRef, Input, Output } from '@angular/core';

@Directive({
    selector: '[pagination]'
})
export class PaginationDirective implements OnInit {
    @Input() totalCount: number;
    @Input() pageSize: number;
    private _currentPage: number;
    @Output() set currentPage(pageNumber: number) {
        this._currentPage = pageNumber;
    };

    constructor(private element: ElementRef) { }

    ngOnInit() {
        if (this.totalCount < this.pageSize) { return; }
        if (!this._currentPage) { this._currentPage = 1; }

        const countElts = Math.round(this.totalCount / this.pageSize);
        const next = this.currentPage >= countElts ? null : this.currentPage + 1;
        const prev = this.currentPage <= 1 ? null : this.currentPage - 1;
        let html = '';
        /** Установка стрелочки назад */
        if (prev) {
            html += this.generateItem('', '<i class="ui left chevron icon"></i>', prev);
        } else {
            html += this.generateItem('disabled', '<i class="ui left chevron icon"></i>');
        }
        /** Установка самой пагинации */
        if (countElts <= 5) {
            for (let i = 1; i <= 5; i++) {
                html += this.generateItem('', `${i}`, i);
            }
        } else {
            let addThreeDot = false;
            for (let i = this._currentPage; i < countElts ; i++) {
                if (i < countElts - (countElts - 2) || i < countElts - 2) {
                    html += this.generateItem('', `${i}`, i);
                } else {
                    if (addThreeDot) { continue; }
                    html += this.generateItem('disabled', '...');
                    addThreeDot = true;
                }
            }
        }

        /** Установка стрелочки вперед */
        if (next) {
            html += this.generateItem('', '<i class="ui right chevron"></i>', next);
        } else {
            html += this.generateItem('disabled', '<i class="ui right chevron"></i>');
        }
        this.element.nativeElement.innerHTML = html;
    }

    goTo(page: number) {
        console.log(`Current page: ${page}`);
        if (!page) { return; }
        this.currentPage = page;

    }

    generateItem(addinglass: string = '', content: string, pageNumber: number = 0) {
        return ` <a [routerLink]="['/', ${pageNumber}]" class="link ${addinglass ? addinglass : ''} item">
                    ${content}
                 </a> `;
    }
}
