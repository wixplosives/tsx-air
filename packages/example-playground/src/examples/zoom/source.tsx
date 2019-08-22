import { TSXAir, render, lifecycle } from '../../framework';
import { RefHolder } from '../../framework/api/types';
import clamp from 'lodash/clamp';

export const Zoom = TSXAir((props: { url: string }) => {
    let nWidth: number;
    let nHeight: number;
    let dWidth: number;
    let dHeight: number;
    let x = 9;
    let y = 0;
    let loaded = false;

    const zoomedOut: RefHolder<HTMLImageElement> = {};
    const zoomedIn: RefHolder<HTMLImageElement> = {};
    const main: RefHolder<HTMLDivElement> = {};

    const imageLoaded = () => {
        const { naturalWidth, naturalHeight, width, height } = zoomedIn.element!;
        [nWidth, nHeight] = [naturalWidth, naturalHeight];
        [dWidth, dHeight] = [width, height];
        const [rW, rH] = [width / naturalWidth, height / naturalHeight];
        loaded = true;
    };

    const updateZoomLocation = (e: MouseEvent) => {
        const { left, top ,right, bottom} = zoomedOut.element!.getClientRects()[0];
        [x, y] = [e.pageX - left, e.pageY - top];
        [x,y] = [clamp(x, 0, right), clamp(y,0,bottom)];
    };

    return <div className="zoom" ref={main} onMouseMove={updateZoomLocation}>
        <div className="zoomedIn">
            <img src={props.url} alt="Cute animal, up close" ref={zoomedIn} onLoad={imageLoaded} />
        </div>

        <div className="zoomedOut">
            <img src={props.url} alt="Cute animal, zoomed out" ref={zoomedOut} />
            <div className="zoomed" style={`top: ${y}; left:${x}`} />
        </div>
    </div >;
});

export const runExample = (target: HTMLElement) => {
    render(target, Zoom, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};
