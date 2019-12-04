import { Component, Factory, runtime, render, runtimeUtils } from '@wixc3/tsx-air-framework';
import { ZoomCtx, ZoomProps, ZoomState, initialState } from './helper';

export class Zoom extends Component<ZoomCtx, ZoomProps, ZoomState> {
    public static factory: Factory<Zoom>;
    public static readonly changeBitmask = {
        url: 1 << 0,
        x: 1 << 1,
        y: 1 << 2,
        original: 1 << 3,
        zoomFrame: 1 << 4,
        zoomedOutSize: 1 << 5,
        zoomedOut: 1 << 6,
        zoomedIn: 1 << 7,
        root: 1 << 8
    };

    public $$processUpdate(newProps: ZoomProps, newState: ZoomState, changeMap: number): void {
        runtimeUtils.handleChanges(new Map([
            [Zoom.changeBitmask.url, () => {
                this.context.zoomedIn.src = this.context.zoomedOut.src = newProps.url;
            }],
            [Zoom.changeBitmask.x | Zoom.changeBitmask.y | Zoom.changeBitmask.zoomedOutSize | Zoom.changeBitmask.original, () => {
                const { x, y, zoomedOutSize, original } = newState;
                runtimeUtils.setStyle(this.context.zoomedIn, { left: -x / zoomedOutSize.width * original.width, top: -y / zoomedOutSize.height * original.height });
            }],
            [Zoom.changeBitmask.x | Zoom.changeBitmask.y | Zoom.changeBitmask.zoomFrame, () => {
                const { x, y, zoomFrame } = newState;
                runtimeUtils.setStyle(this.context.zoomFrame, { top: y, left: x, ...zoomFrame });
            }]

        ]), changeMap);
    }

    public $afterMount(_ref: HTMLElement) {
        this.context.root.addEventListener('mousemove', e => this.updateZoomLocation(e));
        this.context.zoomedIn.onload = this.updateDimensions;
        window.addEventListener('resize', this.updateDimensions);
    }

    public $afterUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    private updateDimensions = () => {
        const { root, zoomedIn, zoomedOut } = this.context;
        runtime.updateState(this as Zoom, s => {
            // @ts-ignore
            [s.original, s.zoomFrame, s.zoomedOutSize] = calculateDimensions(root, zoomedIn, zoomedOut);
            return Zoom.changeBitmask.original | Zoom.changeBitmask.zoomFrame | Zoom.changeBitmask.zoomedOutSize;
        });
    };

    private updateZoomLocation = (e: MouseEvent) => {
        runtime.updateState(this as Zoom, state => {
            // @ts-ignore
            [state.x, state.y] = calcZoomFrameXY(e, state.zoomedOut.element!, state.zoomFrame, state.zoomedOutSize);
            return Zoom.changeBitmask.x | Zoom.changeBitmask.y;
        });
    };
}

Zoom.factory = {
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
            zoomedIn: root.children[0].children[0] as HTMLImageElement,
            zoomedOut: root.children[1].children[0] as HTMLImageElement,
            zoomFrame: root.children[1].children[1] as HTMLDivElement
        };
        state.zoomedIn.element = context.zoomedIn;
        state.zoomedOut.element = context.zoomedOut;
        state.root.element = context.root;
        return new Zoom(context, props, state);
    },
    initialState
} as Factory<Zoom>;


export const runExample = (target: HTMLElement) => {
    render(target, Zoom as any, { url: '/images/bunny.jpg' });
};