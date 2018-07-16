export function mainOptions() {
    return {
        responsive: true,
        responsiveAnimationDuration: 500,
        maintainAspectRation: true,
        animation: {
            duration: 300
        },
        hover: {
            intersect: false,
            mode: 'index'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
            xPadding: 10,
            yPadding: 10,
            caretPadding: 5,
            caretSize: 5,
            cornerRadius: 3
        },
        legend: {
            display: false
        },
        elements: {
            point: {
                hoverRadius: 5,
                hoverBorderWidth: 2,
                hoverBorderColor: 'green',
                hoverBackgroundColor: 'green'
            },
            line: {
                fill: false,
                borderColor: 'lightblue',
                pointHoverBackgroundColor: 'green'
            }
        },
        scales: {
            yAxes: {
                type: 'linear',
                beginOnZero: true,
                gridLines: {
                    drawBorder: false
                }
            }
        }
    };
}
