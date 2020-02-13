import clamp from 'lodash/clamp';
import { RefHolder } from '@tsx-air/framework';

export function calculateDimensions(main: HTMLElement, zoomedIn: HTMLImageElement, zoomedOut: HTMLImageElement) {
    const { naturalWidth, naturalHeight } = zoomedIn;
    const { width, height } = main.getClientRects()[0];
    const [rW, rH] = [width / naturalWidth, height / naturalHeight];
    const limitingRatio = Math.min(rH, rW);
    const limitingAxis = rW > rH ? true : false;
    const [zoomWidth, zoomHeight] = [zoomedOut.width * limitingRatio, zoomedOut.height * limitingRatio];
    const [outWidth, outHeight] =
        !limitingAxis
            ? [zoomedOut.width, zoomedOut.width * naturalHeight / naturalWidth]
            : [zoomedOut.height * naturalWidth / naturalHeight, zoomedOut.height];
    // returned as array so the field names are shown in the main file
    return [
        new Area(naturalWidth, naturalHeight),
        new Area(zoomWidth, zoomHeight),
        new Area(outWidth, outHeight),
    ];
}

export function calcZoomFrameXY(e: MouseEvent, zoomedOut: HTMLImageElement, zoomFrame: Area, zoomedOutSize: Area) {
    const { left, top } = zoomedOut.getBoundingClientRect();
    let [x, y] = [e.clientX - left, e.clientY - top];
    [x, y] = [clamp(x, 0, zoomedOutSize.width - zoomFrame.width), clamp(y, 0, zoomedOutSize.height - zoomFrame.height)];
    // returned as array so the field names are shown in the main file
    return [x, y] as [number, number];
}

export class Area {
    constructor(public width = 0, public height = 0) { }
}


export const initialState = (_props?: any) => ({
    state: {
        x: 0, y: 0,
        original: new Area(),
        zoomFrame: new Area(),
        zoomedOutSize: new Area(1, 1),
        zoomedIn: {} as RefHolder<HTMLImageElement>,
        zoomedOut: {} as RefHolder<HTMLImageElement>,
        root: {} as RefHolder<HTMLDivElement>
    }
}) as ZoomState;


export interface ZoomCtx { root: HTMLDivElement; zoomedIn: HTMLImageElement; zoomedOut: HTMLImageElement; zoomFrame: HTMLDivElement; }
export interface ZoomProps { url: string; }
export interface ZoomState {
    state: {
        x: number;
        y: number;
        original: Area;
        zoomFrame: Area;
        zoomedOutSize: Area;
        zoomedOut: RefHolder<HTMLImageElement>;
        zoomedIn: RefHolder<HTMLImageElement>;
        root: RefHolder<HTMLDivElement>;
    }
}
