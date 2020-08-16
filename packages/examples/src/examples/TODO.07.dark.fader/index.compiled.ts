import { CompCreator } from '@tsx-air/framework/src/api/types';
import { RenderTarget, ComponentApi } from '@tsx-air/framework/src';

interface Props {
    baseUrl: string;
}
export const Gallery: CompCreator<Props> = (props: Props) => ({
    props
});
Gallery.render = (props: Props, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw new Error('Now supported in this example');
    }
    const state = {
        images: [
            { dataId: 0, src: 'bunny.jpg' },
            { dataId: 1, src: 'gradient.jpg' },
            { dataId: 2, src: 'pretty-boy.jpg' },
            { dataId: 3, src: 'weird.jpg' }
        ]
    };

    target.innerHTML = `<div class="gallery">
    ${state.images.map((img, i) => `<div key="${img.dataId}">
        <img src="${`/${props.baseUrl}/${img.src}`}"
         title="${`image ${i + 1}/${state.images.length}`}">
    </div>`).join('')}
</div>`;
    return {
        updateProps: (p: Props) => {
            target.querySelectorAll('img').forEach(img => 
                img.setAttribute('src', `/${p.baseUrl}/${img.src}`));
        },
    } as ComponentApi<Props>;
};