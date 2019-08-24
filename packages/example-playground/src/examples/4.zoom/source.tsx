import { TSXAir, render, delegate } from '../../framework';
import { RefHolder } from '../../framework/api/types';
import { calculateDimensions, Area, calcZoomFrameXY } from './helper';


export const Zoom = TSXAir((props: { url: string }) => {

    const zoomedOut: RefHolder<HTMLImageElement> = {};
    const zoomedIn: RefHolder<HTMLImageElement> = {};
    const root: RefHolder<HTMLDivElement> = {};

    let x = 0;
    let y = 0;
    let original = new Area();
    let zoomFrame = new Area();
    let zoomedOutSize = new Area(1, 1);

    const updateDimensions = () => {
        [
            original,
            zoomFrame,
            zoomedOutSize
        ] = calculateDimensions(root.element!, zoomedIn.element!, zoomedOut.element!);
    };

    // Shorthand for afterMount => addEventListener, afterUnmount => removeEventListener
    delegate.window.onresize = updateDimensions;

    const updateZoomLocation = (e: MouseEvent) => {
        [x, y] = calcZoomFrameXY(e, zoomedOut.element!, zoomFrame, zoomedOutSize);
    };

    return <div className="zoom" ref={root} onMouseMove={updateZoomLocation}>
        <div className="zoomedIn">
            <img src={props.url} alt="Cute animal, up close" ref={zoomedIn} onLoad={updateDimensions} />
        </div>

        <div className="zoomedOut">
            <img src={props.url} alt="Cute animal, zoomed out" ref={zoomedOut}
                style={{
                    left: -x / zoomedOutSize.width * original.height,
                    top: -y / zoomedOutSize.height * original.height
                }} />
            <div className="zoomed" style={{ top: y, left: x, ...zoomFrame }} />
        </div>
    </div >;
});

export const runExample = (target: HTMLElement) => {
    render(target, Zoom, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};
