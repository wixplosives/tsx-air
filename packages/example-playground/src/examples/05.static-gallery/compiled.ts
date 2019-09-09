// import { Dom, Component } from '../../framework/types/component';
// import { Factory } from '../../framework/types/factory';
// import runtime from '../../framework/runtime';
// import { Thumb, ThumbFactory } from '../3.thumb/compiled';

// /* tslint:disable:rule no-bitwise */

// // Inferred from the TSX all possible return values 
// interface StaticGalleryCtx extends Dom { thumbs: Thumb[]; }
// interface StaticGalleryProps { urls: string[]; onItemClick?: (url: string, index: number) => void; }

// class StaticGallery extends Component<StaticGalleryCtx, StaticGalleryProps, {}> {

//     public static factory: Factory<StaticGallery>;
//     public static readonly changeBitmask = {
//         onItemClick: 1 << 0
//         // urls: by key
//     };

//     public $$processUpdate(newProps: StaticGalleryProps, _: {}, changeMap: number): void {
//         newProps.urls.forEach((val, index) => {
//             runtime.updateProps(this.context.thumbs[i], p => p.
//         });
//     }
// }

// const initialState = (_: any) => ({});
// StaticGallery.factory = {
//     unique: Symbol('StaticGalleryFactory'),
//     toString: props => `<div class="gallery">
//         ${props.urls.map(url => ThumbFactory.toString({ url, key: url })).join('\n\t')}
//         {}
//     </div>`,
//     hydrate: (element, props, _state) => new StaticGallery(
//         {
//             root: element as HTMLDivElement,
//             // TODO: remove or make optional props and state for hydration. the html should be enough
//             thumbs: (Array.from(element.children) as HTMLElement[]).map((thumb, i) => ThumbFactory.hydrate(thumb, { url: props.urls[i] }))
//         }, props, {}),
//     initialState
// };

export const runExample = (_element: HTMLElement) => {
    // runtime.render(element, StaticGallery.factory, {
    //     urls: ['https://cdn2.thecatapi.com/images/_mtVKrRTD.jpg', 'https://cdn2.thecatapi.com/images/22CDdXQ6U.jpg',
    //         'https://cdn2.thecatapi.com/images/qqyh5pKKs.jpg', 'https://cdn2.thecatapi.com/images/bkmLO58jE.jpg',
    //         'https://cdn2.thecatapi.com/images/KUEJ039io.jpg', 'https://cdn2.thecatapi.com/images/OS1VioBop.jpg',
    //         'https://cdn2.thecatapi.com/images/vxK9Ac6QU.jpg', 'https://cdn2.thecatapi.com/images/c1vgfDv0b.jpg',
    //         'https://cdn2.thecatapi.com/images/5A6g4xtZo.jpg', 'https://cdn2.thecatapi.com/images/mt0WK1Pm_.jpg']
    // });
    // coming soon
};