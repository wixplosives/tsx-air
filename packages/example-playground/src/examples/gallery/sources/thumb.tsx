import { TSXAir, createElement } from '../../../framework/runtime';
import { onMount } from '../../../framework/lifecycle';

const Thumb = TSXAir((props: { url: string }) => {
    const img = new Image();
    let imageLoaded = false;

    onMount(_ref => {
        img.src = props.url;
        img.onload = () => {
            imageLoaded = true;
        };
    });

    return <div className="thumb">
        {imageLoaded ? img : <div className="preloader" />}
    </div>;
});
