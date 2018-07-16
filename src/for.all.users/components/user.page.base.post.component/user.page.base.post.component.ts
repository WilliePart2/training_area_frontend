import { Component } from '@angular/core';
import { ProtectedComponent } from '../../../common/components/protected.component';

import { ListItem } from '../../models/list.item';

@Component({
    selector: 'app-user-page-post-base',
    template: '<div></div>'
})

export class UserPageBasePostComponent extends ProtectedComponent {
    contentId: number;
    type: 'article' | 'list' | 'voting_list' | 'video';
    header: string;
    content: string | Array<ListItem>;
    accordionOpen: boolean;

    toggleAccordion(event: MouseEvent) {
        const elt: HTMLElement = <HTMLElement>event.target;
        if (elt && elt.getAttribute('data-title')) {
            event.stopPropagation();
            this.accordionOpen = !this.accordionOpen;
        }
    }
}
