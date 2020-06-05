import { TSXAir } from '@tsx-air/framework';

export const Vars = TSXAir((p: { count: number }) => <div>{p.count > 0 ? <div>+</div> : <span>-</span> }</div>);

// const Vars = TSXAir((p: { count: number }) => {
//     let message: number | string | JSX.Element = p.count;
//     if (p.count > 10) {
//         message = 'A lot';
//     }
//     if (p.count > 100) {
//         message = <span className="warning">Too much</span>
//     }

//     return <div>{message}</div>
// });

// class VarsCompiled {
//     toString(p, $s) {
//         const $v = TSXAir.runtime.toStringPreRender(VarsCompiled, p, $s);
//         const { message } = $v;
//         return `<div>${message}</div>`
//     }

//     preRender(p, $s) {
//         let message: number | string | JSX.Element = p.count;
//         if (p.count > 10) {
//             message = 'A lot';
//         }
//         if (p.count > 100) {
//             message = Fragment(`<span className="warning">Too much</span>`);
//         }
//     }
// }