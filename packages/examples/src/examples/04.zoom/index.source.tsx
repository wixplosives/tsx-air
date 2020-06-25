
import { calculateDimensions, Area, calcZoomFrameXY } from './helper';
import { TSXAir, store, RefHolder, delegate } from '@tsx-air/framework';

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
        const calc = calculateDimensions(state.root.element!, state.zoomedIn.element!, state.zoomedOut.element!);

        state.original = calc[0]
        state.zoomFrame = calc[1]
        state.zoomedOutSize = calc[2]
        // [
        //     state.original,
        //     state.zoomFrame,
        //     state.zoomedOutSize
        // ] = calculateDimensions(state.root.element!, state.zoomedIn.element!, state.zoomedOut.element!);
    };

    // Shorthand for afterMount => addEventListener, afterUnmount => removeEventListener
    window.onresize = updateDimensions;

    const updateZoomLocation = (e: MouseEvent) => {
        const calc = calcZoomFrameXY(e, state.zoomedOut.element!, state.zoomFrame, state.zoomedOutSize);
        state.x = calc[0];
        state.y = calc[1];
        // [state.x, state.y] = calcZoomFrameXY(e, state.zoomedOut.element!, state.zoomFrame, state.zoomedOutSize);
    };

    // const { x, y, original, zoomFrame, zoomedOutSize } = state;

    return <div className="zoom" ref={state.root} onMouseMove={updateZoomLocation}>
        <div className="zoomedIn">
            <img src={props.url} alt="Cute animal, up close" ref={state.zoomedIn} onLoad={updateDimensions}
                style={{
                    left: -state.x / state.zoomedOutSize.width * state.original.width,
                    top: -state.y / state.zoomedOutSize.height * state.original.height
                }}
            />
        </div>

        <div className="zoomedOut">
            <img src={props.url} alt="Cute animal, zoomed out" ref={state.zoomedOut} />
            <div className="zoomed" style={{ top: state.y, left: state.x, ...state.zoomFrame }} />
        </div>
    </div >;
});
