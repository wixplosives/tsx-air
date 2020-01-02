import { TSXAir, render, store, when } from '@tsx-air/framework';

export const Thumb = TSXAir((props: { url: string, onClick?: (e:MouseEvent) => void }) => {
    const state = store({
        img: new Image(),
        imageLoaded: false
    });
    // runs only once, since img does not change
    state.img.onload = () => {
        state.imageLoaded = true;
    };

    when(props.url, () => {
        state.img.src = props.url;
        state.imageLoaded = false;
    });

    // TODO: see if there's a way to make {onClick} valid for props forwarding
    return <div className="thumb" onClick={props.onClick} >
        {state.imageLoaded ? state.img : <div className="preloader" />}
    </div>;
});
