const spinners = [...new Array(10).keys()];
const colors = [
    'white',
    'grey',
    'darkgrey',
    'darkgrey',
    'black',
    'black',
    'black'
];
const randColor = () => colors[(Math.random() * colors.length) | 0];

const animationDir = (i:number) => {
    switch (i % 4) {
        case 0:
            return 'normal';
        case 1:
            return 'reverse';
        case 2:
            return 'alternate';
        case 3:
            return 'alternate-reverse';
    }
    return '';
};

export const preloader=()=>
`<div class="preloader">
    ${spinners.map(i => `<div
            class="animator"
            style="animation-duration: ${((5 + i) * Math.PI) / 20}s; animation-delay: ${-Math.random()}s;
            animation-direction: ${animationDir(i)}"
        ><div class="spinner" style="transform: scale(${0.08 * i + 0.4}); border-color: ${randColor()}" />
        </div>`).join('')}
</div>`;

