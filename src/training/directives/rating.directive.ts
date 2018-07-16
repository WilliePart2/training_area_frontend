import {Directive, OnInit, ElementRef, HostBinding } from '@angular/core';

@Directive({
    selector: '[rating]'
})

export class RatingDirective {
    @HostBinding('dataset.dataRating') rating = 3;
}
