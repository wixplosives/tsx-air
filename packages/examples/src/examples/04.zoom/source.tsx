
import { calculateDimensions, Area, calcZoomFrameXY } from './helper';
import { TSXAir, store, RefHolder, delegate, render } from '@tsx-air/framework';

export const Zoom = TSXAir((props: { url: string }) => {
    const state = store({
        zoomedOut: {} as RefHolder<HTMLImageElement>,
        zoomedIn: {} as RefHolder<HTMLImageElement>,
        root: {} as RefHolder<HTMLDivElement>,
        x: 0,
        y: 0,
        original: new Area(),
        zoomFrame: new Area(),
        zoomedOutSize: new Area(1, 1),
    });

    const updateDimensions = () => {
        [
            state.original,
            state.zoomFrame,
            state.zoomedOutSize
        ] = calculateDimensions(state.root.element!, state.zoomedIn.element!, state.zoomedOut.element!);
    };

    // Shorthand for afterMount => addEventListener, afterUnmount => removeEventListener
    delegate.window.onresize = updateDimensions;

    const updateZoomLocation = (e: MouseEvent) => {
        [state.x, state.y] = calcZoomFrameXY(e, state.zoomedOut.element!, state.zoomFrame, state.zoomedOutSize);
    };

    const {
        zoomedOut,
        zoomedIn,
        root,
        x,
        y,
        original,
        zoomFrame,
        zoomedOutSize
    } = state;
    return <div className="zoom" ref={root} onMouseMove={updateZoomLocation}>
        <div className="zoomedIn">
            <img src={props.url} alt="Cute animal, up close" ref={zoomedIn} onLoad={updateDimensions} />
        </div>

        <div className="zoomedOut">
            <img src={props.url} alt="Cute animal, zoomed out" ref={zoomedOut}
                style={{
                    left: -x / zoomedOutSize.width * original.width,
                    top: -y / zoomedOutSize.height * original.height
                }} />
            <div className="zoomed" style={{ top: y, left: x, ...zoomFrame }} />
        </div>
    </div >;
});

export const runExample = (target: HTMLElement) => {
    render(target, Zoom, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};
