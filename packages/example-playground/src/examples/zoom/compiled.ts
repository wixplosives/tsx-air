import clamp from 'lodash/clamp';
import runtime from '../../framework/runtime';
import { Stateful } from '../../framework/types/component';
import { Factory } from '../../framework/types/factory';
import { RefHolder } from '../../framework/api/types';
import { noop, Diff } from '../../framework/runtime/utils';

const initialState = (_props?: any) => ({
    loaded: false,
    x: 0, y: 0,
    zoomedOut: {},
    zoomedIn: {},
    main: {},
    zoomWidth: 0,
    zoomHeight: 0,
    outWidth: 1,
    outHeight: 1,
    nHeight: 0,
    nWidth: 0
}) as ZoomState;
export const ZoomFactory: Factory<Zoom> = {
    unique: Symbol('ZoomFactory'),
    toString: (props, state?) => {
        state = state || initialState(props);
        return `<div class="zoom" ref={main}>
            <div class="zoomedIn">
                <img src="${props.url}" alt="Cute animal, up close" ref={zoomedIn} />
            </div>

            <div class="zoomedOut">
                <img src="${props.url}" alt="Cute animal, zoomed out" />
                <div class="zoomed" />
            </div>
        </div >`;
    },
    hydrate: (root: HTMLElement, props: ZoomProps, state?: ZoomState) => {
        state = state || initialState();
        const context: ZoomCtx = {
            root: root as HTMLDivElement,
            img1: root.children[0].children[0] as HTMLImageElement,
            img2: root.children[1].children[0] as HTMLImageElement,
            div1: root.children[1].children[1] as HTMLDivElement
        };
        state.zoomedIn.element = context.img1;
        state.zoomedOut.element = context.img2;
        state.main.element = context.root;
        return new Zoom(context, props, state);
    },
    initialState
};


interface ZoomCtx { root: HTMLDivElement; img1: HTMLImageElement; img2: HTMLImageElement; div1: HTMLDivElement; }
interface ZoomProps { url: string; }
interface ZoomState {
    nWidth: number;
    nHeight: number;
    x: number;
    y: number;
    zoomWidth: number;
    zoomHeight: number;
    loaded: boolean;
    outWidth: number;
    outHeight: number;
    zoomedOut: RefHolder<HTMLImageElement>;
    zoomedIn: RefHolder<HTMLImageElement>;
    main: RefHolder<HTMLDivElement>;
}

class Zoom implements Stateful<ZoomCtx, ZoomProps, ZoomState> {

    public $beforeUpdate = noop;
    public $updateProps = noop;
    public $afterMount = noop;
    public $afterUnmount = noop;
    public $afterUpdate = noop;

    constructor(public readonly context: ZoomCtx, public readonly props: ZoomProps, public readonly state: ZoomState) {
        context.root.addEventListener('mousemove', e => this.updateZoomLocation(e));
        context.img1.onload = () => this.imageLoaded();
    }

    public $updateState(_d: Diff<ZoomState>, delta: Partial<ZoomState>) {
        if (delta && ['x', 'y', 'zoomWidth', 'zoomHeight'].some(i => i in delta)) {
            const s = { ...this.state, ...delta } as ZoomState;
            this.context.div1.setAttribute('style', `left:${s.x}px;top:${s.y}px;width:${s.zoomWidth}px;height:${s.zoomHeight}px;`);
            this.context.img1.setAttribute('style', `left:${-s.x / s.outWidth * s.nWidth}px; top:${-s.y / s.outHeight * s.nHeight}px;`);
        }
    }

    private imageLoaded() {
        const { naturalWidth, naturalHeight } = this.context.img1;
        const { width, height } = this.context.root.getClientRects()[0];
        const [nWidth, nHeight] = [naturalWidth, naturalHeight];
        const [rW, rH] = [width / naturalWidth, height / naturalHeight];
        const limitingRatio = Math.min(rH, rW);
        const limitingAxis = rW > rH ? true : false;
        const { img2 } = this.context;
        const [zoomWidth, zoomHeight] = [img2.width * limitingRatio, img2.height * limitingRatio];
        const [outWidth, outHeight] = !limitingAxis ? [img2.width, img2.width * nHeight / nWidth] : [img2.height * nWidth / nHeight, img2.height];
        const loaded = true;
        runtime.updateState(this, {
            nWidth, nHeight, loaded,
            zoomWidth, zoomHeight,
            outWidth, outHeight
        });
    }

    private updateZoomLocation(e: MouseEvent) {
        const { left, top } = this.context.img2.getClientRects()[0];
        let [x, y] = [e.pageX - left, e.pageY - top];
        [x, y] = [clamp(x, 0, this.state.outWidth - this.state.zoomWidth), clamp(y, 0, this.state.outHeight - this.state.zoomHeight)];
        runtime.updateState(this, { x, y });
    }
}

export const runExample = (target: HTMLElement) => {
    runtime.render(target, ZoomFactory, { url: 'http://popcornhorror.com/wp-content/uploads/2019/04/il_794xN.976721434_g4v6.jpg' });
};
