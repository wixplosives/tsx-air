import { TSXAir, lifecycle, render } from '../../framework';

export const Thumb = TSXAir((props: { url: string }) => {
    const img = new Image();
    let imageLoaded = false;

    // all component lifecycle stages are accessed from the "lifecycle" object using handlers
    lifecycle.afterMount(_ref => {
        img.src = props.url;
        img.onload = () => {
            imageLoaded = true;
        };
    });

    // "beforeUpdate" is called before applying changes to the view or scope variables
    // newProps are a full list of props as set by the parent/update,
    // _changedVars is the scope vars diff, (mirroring the state delta in the runtime)
    lifecycle.beforeUpdate((newProps: { url: string }, _changedVars: { imageLoaded?:boolean}) => {
        if (img.src !== newProps.url) {
            imageLoaded = false;
            img.src = newProps.url;
        }
    });

    return <div className="thumb" >
        {imageLoaded ? img : <div className="preloader" />}
    </div>;
});

export const runExample = (target: HTMLElement) => {
    render(target, Thumb, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};
