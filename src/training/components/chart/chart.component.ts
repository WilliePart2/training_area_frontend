import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
    selector: 'chart',
    templateUrl: './chart.component.html'
})

export class ChartComponent implements OnInit {
    @ViewChild('myChart') chartElt: ElementRef;
    ngOnInit() {
        /** Установка значения по умолчанию для scale */
        Chart.scaleService.updateScaleDefaults('linear', {
            display: true,
            offset: true,
            position: 'top',
            xAxes: {
                offset: true,
                position: 'top',
                weight: 50
            },
            weight: 5,
            /** Устанавливает нижнюю границу */
            ticks: {
                suggestedMin: 5,
                suggestedMax: 65
            }
        });
        /** Создание графика */
        const context = this.chartElt.nativeElement.getContext('2d');
        const chart = new Chart(context, {
            type: 'line',
            data: {
                labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                datasets: [
                    {
                        label: 'First chart',
                        backgroundColor: 'rgba(100,100,100, .3)',
                        borderColor: 'rgba(50, 100, 70, .7)',
                        fill: false,
                        data: [13, 10, 20, 15, 30, 35, 23, 42],
                        color: function(ctx) {
                            console.log(ctx);
                        },
                        yAxisID: 'first-y-axes'
                    },
                    {
                        label: 'Second chart',
                        data: [23, 45, 60, 37, 48, 56, 30, 70],
                        fill: false,
                        yAxisID: 'second-y-axes'
                    }
                ]
            },
            options: {
                /** Настройки адаптивности графика */
                responsive: true,
                maintainAspectRation: true,
                onResize: function() {
                    console.log('has resize');
                },
                responsiveAnimationDuration: 500,
                /** Конфигурация поведения при hover */
                hover: {
                    intersect: false,
                    mode: 'index',
                },
                /** Конфигурация блока отображающего данные */
                tooltips: {
                    intersect: false,
                    mode: 'index',
                    position: 'average',
                    caretPadding: 5,
                    caretSize: 3,
                    cornerRadius: 2,
                    backgroundColor: 'rgba(50, 50, 50, .8)',
                    multiKeyBackground: 'rgba(50, 50, 50, .5)', /** цвет который обтображаеться в квадратиках элементов легенды в тултипе */
                    callbacks: {
                        title: function(tooltipElt, data) {
                            console.log(tooltipElt);
                            console.log(data);
                        }
                    }

                },
                animation: {
                    duration: 1000,
                    onComplate: function(animation) {
                        console.log(animation);
                    },
                    onProgress: function(animation) {
                        console.log(animation);
                    }
                },
                /** Конфигурация layout */
                layout: {
                    padding: 10
                },
                /** Конфигурация блока "легенды" */
                legend: {
                    display: true,
                    position: 'bottom',
                    fullWidth: true,
                    labels: {
                        padding: 10,
                        boxWidth: 20,
                        fontColor: 'blue',
                        fontSize: 10,
                        fontFamily: 'sans-serif',
                        fontStyle: 'italic',
                        usePointStyle: true /** использовать круглые значки */
                    },
                    // onClick: function(e, legendElement) {
                    //     console.log(e);
                    //     console.log(legendElement);
                    //     console.log(this.chart);
                    // }
                },
                title: {
                    display: true,
                    position: 'top',
                    padding: 10,
                    lineHeight: '2',
                    text: 'Testing chart'
                },
                elements: {
                    point: {
                        radius: 3,
                        hitRadius: 10,
                        hoverRadius: 10, /** Радиус при наведении */
                        hoverBorderWidth: 5,
                        pointStyle: 'circle'
                    }
                },
                steppedLine: 'before',
                scales: {
                    yAxes: [{
                        type: 'linear',
                        position: 'right',
                        id: 'first-y-axes',
                        gridLines: {
                            drawBorder: false
                        },
                        ticks: {
                            beginOnZero: true
                        }
                    }, {
                        type: 'linear',
                        position: 'left',
                        id: 'second-y-axes',
                        gridLines: {
                            drawBorder: false
                        },
                        ticks: {
                            beginOnZero: true
                        }
                    }],
                    xAxes: [{
                        type: 'category',
                        position: 'bottom',
                        offset: true,
                        labels: [
                            'Microcicle 1',
                            'Microcicle 2',
                            'Microcicle 3',
                            'Microcicle 4',
                            'Microcicle 5',
                            'Microcicle 6',
                            'Microcicle 7',
                            'Microcicle 8'
                        ],
                        gridLines: {
                            drawBorder: false
                        }
                    }],
                    gridLines: {
                        drawBorder: false
                    }
                },
                axes: {
                    display: true
                }
            }
        });
    }
}
