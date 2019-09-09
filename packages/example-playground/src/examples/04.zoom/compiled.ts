// import runtime from '../../framework/runtime';
// import { StatefulComponent } from '../../framework/types/component';
// import { Factory } from '../../framework/types/factory';
// import { RefHolder } from '../../framework/api/types';
// import { Diff, handleDiff } from '../../framework/runtime/utils';
// import { calculateDimensions, calcZoomFrameXY, initialState, Area } from './helper';

// export const ZoomFactory: Factory<Zoom> = {
//     unique: Symbol('ZoomFactory'),
//     toString: (props, state?) => {
//         state = state || initialState(props);
//         return `<div class="zoom" ref={main}>
//             <div class="zoomedIn">
//                 <img src="${props.url}" alt="Cute animal, up close" ref={zoomedIn} />
//             </div>

//             <div class="zoomedOut">
//                 <img src="${props.url}" alt="Cute animal, zoomed out" />
//                 <div class="zoomed" />
//             </div>
//         </div >`;
//     },
//     hydrate: (root: HTMLElement, props: ZoomProps, state?: ZoomState) => {
//         state = state || initialState();
//         const context: ZoomCtx = {
//             root: root as HTMLDivElement,
//             zoomedIn: root.children[0].children[0] as HTMLImageElement,
//             zoomedOut: root.children[1].children[0] as HTMLImageElement,
//             zoomFrame: root.children[1].children[1] as HTMLDivElement
//         };
//         state.zoomedIn.element = context.zoomedIn;
//         state.zoomedOut.element = context.zoomedOut;
//         state.root.element = context.root;
//         return new Zoom(context, props, state);
//     },
//     initialState
// };


// export interface ZoomCtx { root: HTMLDivElement; zoomedIn: HTMLImageElement; zoomedOut: HTMLImageElement; zoomFrame: HTMLDivElement; }
// export interface ZoomProps { url: string; }
// export interface ZoomState {
//     x: number; y: number;
//     original: Area;
//     zoomFrame: Area;
//     zoomedOutSize: Area;
//     zoomedOut: RefHolder<HTMLImageElement>;
//     zoomedIn: RefHolder<HTMLImageElement>;
//     root: RefHolder<HTMLDivElement>;
// }

// export class Zoom extends StatefulComponent<ZoomCtx, ZoomProps, ZoomState> {
//     public $updateProps(diff: Diff<ZoomProps>, _newProps: ZoomProps): void {
//         handleDiff(diff, {
//             url: v => {
//                 this.context.zoomedIn.src = v;
//                 this.context.zoomedOut.src = v;
//             }
//         });
//     }

//     public $afterMount(_ref: HTMLElement) {
//         this.context.root.addEventListener('mousemove', e => this.updateZoomLocation(e));
//         this.context.zoomedIn.onload = this.updateDimensions;
//         window.addEventListener('resize', this.updateDimensions);
//     }

//     public $afterUnmount() {
//         window.removeEventListener('resize', this.updateDimensions);
//     }

//     public $updateState(_d: Diff<ZoomState>, delta: Partial<ZoomState>) {
//         const s = { ...this.state, ...delta } as ZoomState;
//         const { x, y, original, zoomFrame, zoomedOutSize } = s;
//         this.context.zoomFrame.setAttribute('style', `left:${x}px;top:${y}px;width:${zoomFrame.width}px;height:${zoomFrame.height}px;`);
//         this.context.zoomedIn.setAttribute('style', `left:${-x / zoomedOutSize.width * original.height}px; top:${-y / zoomedOutSize.height * original.height}px;`);
//     }

//     private updateDimensions = () => {
//         const { root, zoomedIn, zoomedOut } = this.context;
//         const [original, zoomFrame, zoomedOutSize] = calculateDimensions(root, zoomedIn, zoomedOut);
//         runtime.updateState(this, {
//             original, zoomFrame, zoomedOutSize
//         });
//     };

//     private updateZoomLocation(e: MouseEvent) {
//         const { zoomedOut, zoomFrame, zoomedOutSize } = this.state;
//         const [x, y] = calcZoomFrameXY(e, zoomedOut.element!, zoomFrame, zoomedOutSize);
//         runtime.updateState(this, { x, y });
//     }
// }

export const runExample = (_target: HTMLElement) => {
    // runtime.render(target, ZoomFactory, { url: '/images/bunny.jpg' });
};
