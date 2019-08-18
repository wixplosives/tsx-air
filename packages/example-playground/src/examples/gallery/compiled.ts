// import { CompiledComponent, hydrate, render, compToString } from '../../framework/runtime';

// const Thumb: CompiledComponent<{ url: string }> = ({
//     unique: Symbol('Thumb'),
//     // TODO: discuss props/state as attributes (no room for comment)
//     toString: props => `<div class="thumb"><img src="${props.url}" /></div>`,
//     hydrate: (element, _instance) => ({
//         img1: element.childNodes[1],
//     }),
//     update: (props, _state, instance) => {
//         if ('url' in props && props.url !== instance.props.url) {
//             // TODO: discuss context type (can be generated)
//             instance.context.img1.src = props.url;
//         }
//     },
//     unmount: _instance => void(0)
// });


// // TODO: discuss children type and quantity, consider slot approach
// const Page:CompiledComponent<{ children: []}> = ({
//     unique: Symbol('Page'),
//     // 
//     toString: props => `<div class="page">${props.children.map(c => c.toString())}</div>`,
//     hydrate: (element, instance) => {

//     },
//     update: (props, _state, instance) => {

//     },
//     unmount: _instance => void(0)
// });

// // export const Paged: CompiledComponent< >

// export const runExample = (_element: HTMLElement) => {
//     return null;
// };

// ///// TODO
// /**
//  * - Think about class/svelte component
//  * - Compiler ast 
//  */
