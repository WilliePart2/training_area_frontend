import { Component, OnInit, AfterContentChecked, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'pagination',
    templateUrl: './pagination.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class PaginationComponent implements OnInit, AfterContentChecked {
    private _currentPage: number;
    hasItems: boolean;
    items = [];
    rightContent = {};
    leftContent = {};

    @Input() totalCount: number;
    @Input() pageSize: number;
    @Input() set currentPage(pageNumber: number) {
        this._currentPage = pageNumber;
    }
    get currentPage() {
        return this._currentPage;
    }
    @Output() currentPageChange = new EventEmitter <number> ();

    ngOnInit() {
        this.initialize();
    }

    ngAfterContentChecked() {
        this.initialize();
    }

    initialize() {
        this.hasItems = false;
        if (!this.totalCount || !this.pageSize) { return; }
        let countItems = this.totalCount / this.pageSize;
        if (countItems < 1) { return; }

        this.hasItems = true;
        this.items = [];
        countItems = Math.ceil(countItems);

        const prev = this._currentPage <= 1 ? 0 : this._currentPage - 1;
        const next = this._currentPage >= countItems ? 0 : this._currentPage + 1;
        /** Код для кнопки предыдущей страницы */
        this.leftContent = {
            status: prev ? 'link' : 'disabled',
            pageNumber: prev
        };

        /** Вставка основного содержания пагинации */
        if (countItems <= 5) {
            for (let i = 1; i <= countItems; i++) {
                this.items.push({
                    status: i === this._currentPage ? 'active link' : 'link',
                    content: i,
                    pageNumber: i
                });
            }
        } else {
            if ((countItems - this._currentPage) > 3) {
                let dotDotDot = false;
                for (let i = this._currentPage > 1 ? this._currentPage - 1 : this._currentPage; i <= countItems; i++) {
                    if (i <= (this._currentPage > 1 ? this._currentPage + 1 : this._currentPage + 2) || i === countItems) {
                        this.items.push({
                            status: i === this._currentPage ? 'active link' : 'link',
                            content: i,
                            pageNumber: i
                        });
                    } else {
                        if (this.totalCount - this._currentPage > 2) {
                            if (!dotDotDot) {
                                this.items.push({
                                    status: 'disabled',
                                    content: '...',
                                    pageNumber: 0
                                });
                                dotDotDot = true;
                            }
                        } else {
                            this.items.push({
                                status: 'link',
                                content: i,
                                pageNumber: i
                            });
                        }
                    }
                }
            } else {
                for (let i = countItems - 4; i <= countItems; i++) {
                    if (i === countItems - 4 && (countItems - this._currentPage) < 3) {
                        this.items.push({
                            status: 'disabled',
                            content: '...',
                            pageNumber: i
                        });
                        continue;
                    }
                    this.items.push({
                        status: i === this._currentPage ? 'active link' : 'link',
                        content: i,
                        pageNumber: i
                    });
                }
            }
        }

        /** Код для вставки кнопки следующей страницы */
        this.rightContent = {
            status: next ? 'link' : 'disabled',
            pageNumber: next
        };
    }

    goTo(pageNumber: number) {
        if (!pageNumber || pageNumber === this._currentPage) { return; }
        this._currentPage = pageNumber;
        this.currentPageChange.emit(pageNumber);
    }
}
