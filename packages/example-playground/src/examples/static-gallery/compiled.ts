import { Context, StatelessComponent } from './../../framework/types/component';
import { Factory } from '../../framework/types/factory';
import runtime from '../../framework/runtime';
import { handleDiff, Diff } from '../../framework/runtime/utils';
import { Thumb, ThumbFactory } from '../thumb/compiled';


// Inferred from the TSX all possible return values 
interface StaticGalleryCtx extends Context { thumbs: Thumb[]; }
interface StaticGalleryProps { urls: string[]; }

class StaticGallery extends StatelessComponent<StaticGalleryCtx, StaticGalleryProps> {
    public $updateProps(diff: Diff<StaticGalleryProps>) {
        handleDiff(diff, {
            urls: _value => {
                // TODO
            }
        });
    }
}

export const StaticGalleryFactory: Factory<StaticGallery> = {
    unique: Symbol('StaticGalleryFactory'),
    toString: props => `<div class="gallery">
      ${props.urls.map(url => ThumbFactory.toString({ url, key: url })).join('\n\t')}
    </div>`,
    hydrate: (element, props) => new StaticGallery(
        {
            root: element as HTMLDivElement,
            // TODO: remove or make optional props and state for hydration. the html should be enough
            thumbs: (Array.from(element.children) as HTMLElement[]).map((thumb, i) => ThumbFactory.hydrate(thumb, { url:props.urls[i] }))
        }, props)
};

export const runExample = (element: HTMLElement) => {
    runtime.render(element, StaticGalleryFactory, {
        urls: ['https://cdn2.thecatapi.com/images/_mtVKrRTD.jpg', 'https://cdn2.thecatapi.com/images/22CDdXQ6U.jpg',
            'https://cdn2.thecatapi.com/images/qqyh5pKKs.jpg', 'https://cdn2.thecatapi.com/images/bkmLO58jE.jpg',
            'https://cdn2.thecatapi.com/images/KUEJ039io.jpg', 'https://cdn2.thecatapi.com/images/OS1VioBop.jpg',
            'https://cdn2.thecatapi.com/images/vxK9Ac6QU.jpg', 'https://cdn2.thecatapi.com/images/c1vgfDv0b.jpg',
            'https://cdn2.thecatapi.com/images/5A6g4xtZo.jpg', 'https://cdn2.thecatapi.com/images/mt0WK1Pm_.jpg']
    });
};