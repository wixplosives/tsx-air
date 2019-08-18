import { TSXAir, createElement } from '../../framework/runtime';
import { onMount, onAfterChange } from '../../framework/lifecycle';
import { NativeEventHandler } from '../../framework/dom-types';

export const Thumb = TSXAir((props: { url: string, onClick?: NativeEventHandler<HTMLDivElement, MouseEvent> }) => {
    const img = new Image();
    let imageLoaded = false;

    onMount(_ref => {
        img.src = props.url;
        img.onload = () => {
            imageLoaded = true;
        };
    });

    onAfterChange(() => {
        imageLoaded = false;
        img.src = props.url;
    });

    return <div className="thumb" onClick={props.onClick} >
        {imageLoaded ? img : <div className="preloader" />}
    </div>;
});