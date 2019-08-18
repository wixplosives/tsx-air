import { StatefulInstance } from './../../framework/framework-types';
import { noop } from '../../framework/runtime-helpers';
import { StatefulComponentFactory } from '../../framework/framework-types';
import { assignOrCreate, handlePropsUpdate, handleStateUpdate } from '../../framework/runtime-helpers';
import runtime from '../../framework/new.runtime';

interface ThumbProps { url: string; }
interface ThumbState { img: HTMLImageElement; imageLoaded: boolean; }
interface ThumbCtx { img1: HTMLImageElement; div1: HTMLDivElement; div2: HTMLDivElement; }

export const ThumbFactory: StatefulComponentFactory<ThumbCtx, ThumbProps, ThumbState> = {
    unique: Symbol('ThumbFactory'),
    // all derived from the code by the compiler
    initialState: _props => ({
        img: new Image(),
        imageLoaded: false
    }),
    toString: (_props, state) => `<div className="thumb">
        ${state.imageLoaded ? state.img.outerHTML : '<div className="preloader" />'}
    </div>`,
    hydrate: (target, props, state) => {
        // NOTE: we should also implement validation and error recovery in case of mismatch
        // (not shown here for the sake of simplicity)
        const context: ThumbCtx = {
            div1: target.children[0] as HTMLDivElement,
            // here is where the string generation approach starts to smell funny
            // depending of the state, one of those would have to be created
            img1: assignOrCreate(
                target.children[0].childNodes[0],
                HTMLImageElement, { src: props.url }),
            div2: assignOrCreate(
                target.children[0].childNodes[0],
                HTMLDivElement, { className: 'preloader' })
        };
        return new Thumb(props, state, context);
    }
};


export class Thumb implements StatefulInstance<ThumbCtx, ThumbProps, ThumbState> {
    public _beforeUpdate = noop;

    public _afterUnmount = noop;

    constructor(public props: ThumbProps, public state: ThumbState, public context: ThumbCtx) { }

    public _updateProps(props: ThumbProps) {
        const { context: { img1 } } = this;
        handlePropsUpdate(props, this, {
            'url': value => img1.src = value
        });
    }
    public _updateState(state: ThumbState) {
        const { context: { div1, div2, img1 } } = this;
        handleStateUpdate(state, this, {
            imageLoaded: value => div1.innerHTML = value ? img1.outerHTML : div2.outerHTML,
            img: _value => { throw new Error('img is defined as a const'); }
        });
    }
    public _afterMount() {
        const { state, props } = this;
        state.img.src = props.url;
        state.img.onload = () => {
            this.state.imageLoaded = true;
        };
    }
    public _afterUpdate() {
        const { img } = this.state;
        img.src = this.props.url;
        runtime.updateState(this, { imageLoaded: false, img });
    }
}

export const runExample = (element: HTMLElement) => {
    runtime.render(element, ThumbFactory, { url: 'https://i.imgur.com/2Feh8RD.jpg' });
};