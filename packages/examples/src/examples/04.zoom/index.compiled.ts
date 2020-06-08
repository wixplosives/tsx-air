import { Component, Factory, runtime, runtimeUtils } from '@tsx-air/framework';
import { ZoomCtx, ZoomProps, ZoomState, initialState, calcZoomFrameXY, calculateDimensions } from './helper';

export class Zoom extends Component<ZoomCtx, ZoomProps, ZoomState> {
    public static factory: Factory<Zoom>;
    public static readonly changeBitmask = {
        'props.url': 1 << 0,
        'state.zoomedOut': 1 << 1,
        'state.zoomedIn': 1 << 2,
        'state.root': 1 << 3,
        'state.x': 1 << 4,
        'state.y': 1 << 5,
        'state.original': 1 << 6,
        'state.zoomFrame': 1 << 7,
        'state.zoomedOutSize': 1 << 8
    };

    public updateView(newProps: ZoomProps, { state }: ZoomState, _:any, changeMap: number): void {
        if (changeMap & Zoom.changeBitmask['props.url']) {
            this.context.zoomedIn.src = this.context.zoomedOut.src = newProps.url;
        }
        if (
            changeMap &
            (Zoom.changeBitmask['state.x'] |
                Zoom.changeBitmask['state.y'] |
                Zoom.changeBitmask['state.zoomedOutSize'] |
                Zoom.changeBitmask['state.original'])
        ) {
            const { x, y, zoomedOutSize, original } = state;
            runtimeUtils.setStyle(this.context.zoomedIn, {
                left: (-x / zoomedOutSize.width) * original.width,
                top: (-y / zoomedOutSize.height) * original.height
            });
        }
        if (
            changeMap &
            (Zoom.changeBitmask['state.x'] | Zoom.changeBitmask['state.y'] | Zoom.changeBitmask['state.zoomFrame'])
        ) {
            const { x, y, zoomFrame } = state;
            runtimeUtils.setStyle(this.context.zoomFrame, { top: y, left: x, ...zoomFrame });
        }
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
        runtime.updateState(this as Zoom, {}, ({ state }) => {
            // @ts-ignore
            [state.original, state.zoomFrame, state.zoomedOutSize] = calculateDimensions(root, zoomedIn, zoomedOut);
            return (
                Zoom.changeBitmask['state.original'] |
                Zoom.changeBitmask['state.zoomFrame'] |
                Zoom.changeBitmask['state.zoomedOutSize']
            );
        });
    };

    private updateZoomLocation = (e: MouseEvent) => {
        runtime.updateState(this as Zoom, {}, ({ state }) => {
            // @ts-ignore
            [state.x, state.y] = calcZoomFrameXY(e, state.zoomedOut.element!, state.zoomFrame, state.zoomedOutSize);
            return Zoom.changeBitmask['state.x'] | Zoom.changeBitmask['state.y'];
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
    hydrate: (root: HTMLElement, props: ZoomProps, s?: ZoomState) => {
        s = s || initialState();
        const { state } = s;
        const context: ZoomCtx = {
            root: root as HTMLDivElement,
            zoomedIn: root.children[0].children[0] as HTMLImageElement,
            zoomedOut: root.children[1].children[0] as HTMLImageElement,
            zoomFrame: root.children[1].children[1] as HTMLDivElement
        };
        state.zoomedIn.element = context.zoomedIn;
        state.zoomedOut.element = context.zoomedOut;
        state.root.element = context.root;
        return new Zoom(context, props, s);
    },
    initialState
} as Factory<Zoom>;