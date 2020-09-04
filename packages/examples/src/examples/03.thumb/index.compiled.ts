import { CompCreator } from '@tsx-air/framework/src/api/types';
import { RenderTarget, ComponentApi } from '@tsx-air/framework';

interface Props {
    imageId: string;
    resolution: 'high' | 'low';
}

export const Thumb: CompCreator<Props> = (props: Props) => ({
    props
});

Thumb.render = (props: Props, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw new Error('Now supported in this example');
    }

    const state = {
        imageLoaded: false,
        metaData: 'Loading metadata'
    };


    target.innerHTML = `<div class="thumb"><div class="title"></div></div>`;
    const root = target.children[0];
    const title = root.childNodes[0];
    const setTitle = () =>
        title.textContent = `${props.imageId.replace(/^.*\//g, '').replace(/\.\w{0,3}$/, '')}`;
    setTitle();

    const preloader = document.createElement('div');
    preloader.classList.add('preloader');
    root.appendChild(preloader);

    const img = document.createElement('img');
    root.appendChild(img);
    img.addEventListener('load', () => {
        state.imageLoaded = true;
        updateView();
    });

    const setImage = () => {
        state.imageLoaded = false;
        const imgUrl = `${
            props.resolution === 'high' ? '/images' : '/low-res'
            }/${props.imageId}.jpg`;
        img.setAttribute('src', imgUrl);
    };
    setImage();

    const updateImgTitle = () => {
        state.metaData = 'Loading metadata';
        fetch(`/meta/${props.imageId}.json`)
            .then(r => r.json()).then(meta => {
                state.metaData = meta.hover;
                img.setAttribute('title', state.metaData);
            })
            .catch(() => state.metaData = 'No metadata');
    };
    root.append(preloader);

    const updateView = () => {
        if (state.imageLoaded) {
            root.removeChild(preloader);
            img.setAttribute('style', 'display:block');
        } else {
            root.insertBefore(preloader, img);
            img.setAttribute('style', 'display:none');
        }
    };

    updateView();

    const setProp = (prop: string, value: any) => {
        updateProps({...props, [prop]:value});
    };
    const updateProps = (p: Props) => {
        if (p.imageId === props.imageId && p.resolution === props.resolution) {
            return;
        }         
        if (p.imageId !== props.imageId) {
            props = p;
            updateImgTitle();
        }
        props = p;
        setTitle();
        setImage();
        updateView();
    };

    return { setProp, updateProps } as ComponentApi<Props>;
};
