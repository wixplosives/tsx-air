import { CompCreator, RefHolder } from "@tsx-air/framework/src/api/types";
import { RenderTarget, ComponentApi } from "@tsx-air/framework/src";
import { Area, calculateDimensions, calcZoomFrameXY } from "./helper";

interface Props {
    url: string;
}
export const Zoom: CompCreator<Props> = (props: Props) => ({
    props
});
Zoom.render = (props: Props, _?: object, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw 'Now supported in this example';
    }

    const state = {
        zoomedOut: {} as RefHolder<HTMLImageElement>,
        zoomedIn: {} as RefHolder<HTMLImageElement>,
        root: {} as RefHolder<HTMLDivElement>,
        x: 0,
        y: 0,
        original: new Area(),
        zoomFrame: new Area(),
        zoomedOutSize: new Area(1, 1),
    };

    const updateZoomLocation = (e: MouseEvent) => {
        [state.x, state.y] = calcZoomFrameXY(e, state.zoomedOut.element!, state.zoomFrame, state.zoomedOutSize);
        requestAnimationFrame(updateView);
    };

    const updateDimensions = () => requestAnimationFrame(() => {
        [
            state.original,
            state.zoomFrame,
            state.zoomedOutSize
        ] = calculateDimensions(state.root.element!, state.zoomedIn.element!, state.zoomedOut.element!);
        updateView();
    });

    target.innerHTML = `<div class="zoom">
    <div class="zoomedIn">
        <img src=${props.url} alt="Cute animal, up close"></img>
    </div>

    <div class="zoomedOut">
        <img src=${props.url} alt="Cute animal, zoomed out"  ></img>
        <div class="zoomed" />
    </div>
</div >`
    const root = target.children[0] as HTMLDivElement;
    root.addEventListener('mousemove', updateZoomLocation);
    state.root.element = root;
    const imgs = root.querySelectorAll('img');
    state.zoomedIn.element = imgs[0];
    imgs[0].addEventListener('load', updateDimensions);
    state.zoomedOut.element = imgs[1];
    const zoomed = imgs[1].nextElementSibling!;

    const updateView = () => {
        imgs[0].setAttribute('style', `left: ${
            -state.x / state.zoomedOutSize.width * state.original.width}px;top: ${
            -state.y / state.zoomedOutSize.height * state.original.height}px`)

        zoomed.setAttribute('style', `top:${
            state.y}px;left:${state.x}px;width:${
            state.zoomFrame.width}px;height:${
            state.zoomFrame.height}px`)
    }
    updateView();

    return {
        updateProps: (props: Props) => {
            imgs[0].setAttribute('src', props.url);
            imgs[1].setAttribute('src', props.url);
            requestAnimationFrame(updateView);
        },
    } as ComponentApi<Props>;
}
