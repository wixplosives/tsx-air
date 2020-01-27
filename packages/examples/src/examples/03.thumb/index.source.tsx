import { TSXAir, store, when } from '@tsx-air/framework';
// tslint:disable: jsx-no-lambda

export const Thumb = TSXAir((props: { url: string, onClick?: (e: MouseEvent) => void }) => {
    const state = store({
        imageLoaded: false
    });

    when(props.url, () => {
        state.imageLoaded = false;
    });

    // TODO: see if there's a way to make {onClick} valid for props forwarding
    return <div className="thumb" onClick={props.onClick} >
        {state.imageLoaded ? null : <div className="preloader" />}
        <img src={props.url} onLoad={() => state.imageLoaded = true} style={{ display: state.imageLoaded ? 'block' : 'none' }} />
    </div>;
});
