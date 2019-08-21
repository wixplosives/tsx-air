import { TSXAir, lifecycle, render } from '../../framework';

export const Thumb = TSXAir((props: { url: string }) => {
    const img = new Image();
    let imageLoaded = false;

    lifecycle.onMount(_ref => {
        img.src = props.url;
        img.onload = () => {
            imageLoaded = true;
        };
    });

    lifecycle.beforeUpdate(() => {
        if (img.src !== props.url) {
            imageLoaded = false;
            img.src = props.url;
        }
    });

    return <div className="thumb" >
        {imageLoaded ? img : <div className="preloader" />}
    </div>;
});

export const runExample = (target: HTMLElement) => {
    render(target, Thumb, { url: 'https://i.imgur.com/2Feh8RD.jpg' });
};
