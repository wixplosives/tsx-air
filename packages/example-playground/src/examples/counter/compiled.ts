// import { Factory } from './../../framework/types/factory';
// import { Context } from '../../framework/types/component';
// import { StatelessComponent } from '../../framework/types/component';
// import runtime from '../../framework/runtime';
// import { Digit, DigitFactory } from '../digit/compiled';


// interface CounterProps { children: string; }
// interface CounterCtx extends Context {
//     digits: { [key: string]: Digit };
// }

// const isDigit = /\d/.test;
// const singleDigitOrMultiNonDigits = /\d|[^\d]+/g;
// const breakToKV = (s: string) => (s.match(singleDigitOrMultiNonDigits) || []).map((s, i, { length }) => ({
//     value: s,
//     key: '' + (length - i)
// }));

// class Counter extends StatelessComponent<CounterCtx, CounterProps> {
//     public $updateProps(_: any, newProps: CounterProps): void {
//         const breakdown = breakToKV(newProps.children);
//         const digits = breakdown.filter(({ value }) => isDigit(value));

//         runtime.updateChildComponent(this, digits.map(({ key, value }) => ({ key, value, updateTime: Date.now() })));

//         this.context.root.innerHTML = '';
//         breakdown.forEach(({ value, key }) => {
//             if (isDigit(value)) {
//                 this.context.root.appendChild(this.context.digits[key].context.root);
//             } else {
//                 const span = document.createElement('span');
//                 span.textContent = value;
//                 this.context.root.appendChild(span);
//             }
//         });
//     }
// }

// export const CounterFactory: Factory<Counter> = {
//     toString: (props: CounterProps) => `<div class="counter">
//         ${breakToKV(props.children).map(({ value, key }) =>
//         isDigit(value)
//             ? DigitFactory.toString({ value, key, updateTime: Date.now() })
//             : `<span>${value}</span>`)}`,
//     hydrate: (root, props) => new Counter({
//         root,
//         digits: Array.from(root.children)
//             .filter(i => !(i instanceof HTMLSpanElement))
//             .map((d, i) => DigitFactory.hydrate(d, { props })).reduce((acc, instance, index) => ({
//                 ...acc,
//                 []
//             }), {}),
//     }, props)
// };



export const runExample = (_target: HTMLElement) => {
//     let val = 0;
//     const comp = runtime.render(target, DigitFactory, { value: '' + val })!;
//     const intId = setInterval(() => {
//         runtime.updateProps(comp, { value: '' + val, updateTime: Date.now() });
//         val++;
//         val %= 10;
//     }, 200);
//     return () => clearInterval(intId);
};
