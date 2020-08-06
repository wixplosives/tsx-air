import { TSXAir, store, when, memo } from '@tsx-air/framework';
// tslint:disable: jsx-no-lambda

export const Thumb = TSXAir((props: { url: string, onClick?: (e: MouseEvent) => void }) => {
    const state = store({
        imageLoaded: false,
    });

    when(props.url, () => state.imageLoaded = false);
    const url = memo(()=>props.url.replace(/^[^\/]+\//,''));

    // TODO: see if there's a way to make {onClick} valid for props forwarding
    return <div className="thumb" onClick={props.onClick} >
        <div>{url}</div>
        {state.imageLoaded ? '' : <div className="preloader" />}
        <img src={props.url} onLoad={() => state.imageLoaded = true}
        style={{ display: state.imageLoaded ? 'block' : 'none' }} />
    </div>;
});
