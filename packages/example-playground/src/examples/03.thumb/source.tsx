import { TSXAir, render, store, when } from '../../framework';

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

export const runExample = (target: HTMLElement) => {
    render(target, Thumb, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};
