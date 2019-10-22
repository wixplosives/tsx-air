// import { Dom, Component } from '../../framework/types/component';
// import { Factory } from '../../framework/types/factory';
// import runtime from '../../framework/runtime';
// import { Thumb, ThumbProps } from '../03.thumb/compiled';
// import { handleChanges } from '../../framework/runtime/utils';
// import { Zoom, ZoomProps } from '../04.zoom/compiled';

// // Inferred from the TSX all possible return values 
// interface StaticGalleryCtx extends Dom { thumbs: Thumb[]; zoomed: Zoom | null; }
// interface StaticGalleryProps { urls: string[]; onItemClick?: (url: string, index: number) => void; }
// interface StaticGalleryState { zoomed: string | null; }

// class StaticGallery extends Component<StaticGalleryCtx, StaticGalleryProps, StaticGalleryState> {
//     public static factory: Factory<StaticGallery>;
//     public static readonly changeBitmask = {
//         onItemClick: 1 << 0,
//         urls: 1 << 1,
//         zoomed: 1 << 2
//     };


//      zoomedFactory: Factory<Zoom> = {
//         unique: Symbol('ZoomFactoryWrapper'),
//         toString: (props, state = Zoom.factory.initialState(props)) => {
//             return `<div className="modal">
//                 ${ Zoom.factory.toString(props, state)}
//             </div>`;
//         },
//         hydrate: (root: HTMLElement, props, state) => {
//             root.addEventListener('click', this.turnOffZoom);
//             return Zoom.factory.hydrate(root.children[0] as HTMLElement, props, state);
//         },
//         initialState: Zoom.factory.initialState
//     };

//     private fragments = {
//         zoomed: null
//     };

//     $$processUpdate(newProps: StaticGalleryProps, newState: StaticGalleryState, changeMap: number): void {
//         handleChanges(new Map([
//             [StaticGallery.changeBitmask.urls, () => {
//                 newProps.urls.forEach((val, i) =>
//                     runtime.updateProps(this.context.thumbs[i] as Thumb, (p: ThumbProps) => {
//                         p.url = val;
//                         return StaticGallery.changeBitmask.urls;
//                     }
//                     ));
//             }],
//             [StaticGallery.changeBitmask.zoomed, () => {
//                 if (newState.zoomed) {
//                     if (this.context.zoomed) {
//                         runtime.updateProps(this.context.zoomed, (p: ZoomProps) => {
//                             p.url = newState.zoomed!;
//                             return Zoom.changeBitmask.url;
//                         }
//                     } else {
//                         this.context.zoomed = 
//                     }
//                 } else {
//                     if (this.context.zoomed) {
//                         this.context.zoomed.remove();
//                     }
//                 }
//             }]
//         ]), changeMap);
//     }

//     $afterMount() {
//         const self = this as StaticGallery;
//         this.context.thumbs.forEach(
//             (thumb, i) => runtime.updateProps(thumb as Thumb, (p: ThumbProps) => {
//                 p.onClick = () => {
//                     // @ts-ignore
//                     runtime.updateState(self as StaticGallery, (s: StaticGalleryState) => {
//                         s.zoomed = thumb.props.url;
//                         return StaticGallery.changeBitmask.zoomed;
//                     });
//                     if (this.props.onItemClick) {
//                         this.props.onItemClick(thumb.props.url, i);
//                     }
//                 };
//                 return Thumb.changeBitmask.onClick;
//             })
//         );
//     }


//     private turnOffZoom = () => {
//         runtime.updateState(this as StaticGallery, s => {
//             s.zoomed = null;
//             return StaticGallery.changeBitmask.zoomed;
//         });
//     };
// }

// const initialState = (_?: any) => ({ zoomed: null }) as StaticGalleryState;
// StaticGallery.factory = {
//     unique: Symbol('StaticGalleryFactory'),
//     toString: (props, state = initialState()) => `<div class="gallery">
//         ${props.urls.map(url => Thumb.factory.toString({ url, key: url })).join('\n\t')}
//         ${ state.zoomed ? Zoom.factory.toString({ url: state.zoomed }) : null}
//     </div>`,
//     hydrate: (element, props, state: StaticGalleryState = initialState(props)) => {
//         const children = (Array.from(element.children) as HTMLElement[]);
//         const url = state && state.zoomed || null;
//         let instance: StaticGallery;
//         const hydrateZoomed = initialState.;
//         instance = new StaticGallery({
//             root: element as HTMLDivElement,
//             // TODO: remove or make optional props and state for hydration. the html should be enough
//             thumbs: (url ? children.slice(0, -1) : children).map((thumb, i) => Thumb.factory.hydrate(thumb, { url: props.urls[i] })),
//             zoomed: url ? instance!.hydrateZoomed(children.slice(-1)[0], { url }) : null
//         }, props, state);
//         return instance;
//     },
//     // render: (root, props, state) => {

//     // },
//     initialState
// } as Factory<StaticGallery>;

export const runExample = (_element: HTMLElement) => {
    // runtime.render(element, StaticGallery.factory, {
    //     urls: ['https://cdn2.thecatapi.com/images/_mtVKrRTD.jpg', 'https://cdn2.thecatapi.com/images/22CDdXQ6U.jpg',
    //         'https://cdn2.thecatapi.com/images/qqyh5pKKs.jpg', 'https://cdn2.thecatapi.com/images/bkmLO58jE.jpg',
    //         'https://cdn2.thecatapi.com/images/KUEJ039io.jpg', 'https://cdn2.thecatapi.com/images/OS1VioBop.jpg',
    //         'https://cdn2.thecatapi.com/images/vxK9Ac6QU.jpg', 'https://cdn2.thecatapi.com/images/c1vgfDv0b.jpg',
    //         'https://cdn2.thecatapi.com/images/5A6g4xtZo.jpg', 'https://cdn2.thecatapi.com/images/mt0WK1Pm_.jpg']
    // });
};