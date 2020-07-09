import { CompCreator } from '@tsx-air/framework/src/api/types';
import { RenderTarget, ComponentApi } from '@tsx-air/framework/src';

interface Props {
    url: string;
}
export const Thumb: CompCreator<Props> = (props: Props) => ({
    props
});
Thumb.render = (props: Props, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw new Error('Now supported in this example');
    }

    const state = {
        imageLoaded: false
    };
    target.innerHTML = `<div class="thumb"></div>`;
    const root = target.children[0];
    const preloader = document.createElement('div');    
    preloader.classList.add('preloader');
    const img = document.createElement('img');
    img.setAttribute('src', props.url);
    img.addEventListener('load', ()=> {
        state.imageLoaded = true;
        updateView();
    });
    root.append(img);

    const updateView = () => {
        if (state.imageLoaded) {
            root.removeChild(preloader);
            img.setAttribute('style', 'display:block');
        } else {
            root.prepend(preloader);
            img.setAttribute('style', 'display:none');
        }
    };

    updateView();

    return {
        updateProps: (p: Props) => {
            img.setAttribute('src', p.url);
            state.imageLoaded = false;
            updateView();
        },
    } as ComponentApi<Props>;
};
