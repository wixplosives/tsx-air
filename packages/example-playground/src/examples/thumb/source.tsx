import { TSXAir, lifecycle, render } from '../../framework';

export const Thumb = TSXAir((props: { url: string }) => {
    const img = new Image();
    let imageLoaded = false;

    // all component lifecycle stages are accessed from the "lifecycle" object using handlers
    lifecycle.onMount(_ref => {
        img.src = props.url;
        img.onload = () => {
            imageLoaded = true;
        };
    });

    // "beforeUpdate"
    lifecycle.beforeUpdate((p: { url: string }) => {
        if (img.src !== p.url) {
            imageLoaded = false;
            img.src = p.url;
        }
    });

    return <div className="thumb" >
        {imageLoaded ? img : <div className="preloader" />}
    </div>;
});

export const runExample = (target: HTMLElement) => {
    render(target, Thumb, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};
