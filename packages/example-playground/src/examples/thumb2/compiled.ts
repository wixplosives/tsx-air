import { noop, Diff, handleDiff } from '../../framework/runtime/utils';
import runtime from '../../framework/runtime';
import { Stateful } from '../../framework/types/component';
import { Factory } from '../../framework/types/factory';

interface ThumbProps { url: string; }
interface ThumbState { img: HTMLImageElement; imageLoaded: boolean; }
interface ThumbCtx { img1: HTMLImageElement; div1: HTMLDivElement; div2?: HTMLDivElement; }

export const ThumbFactory: Factory<Thumb> = {
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
            img1: state.imageLoaded ? target.children[0].children[0] as HTMLImageElement : state.img,
            div2: state.imageLoaded ? undefined : target.children[0].childNodes[0] as HTMLDivElement
        };
        return new Thumb(props, state, context);
    }
};


export class Thumb implements Stateful<ThumbCtx, ThumbProps, ThumbState> {
    public $beforeUpdate = noop;
    public $afterUnmount = noop;

    constructor(public readonly props: ThumbProps, public readonly state: ThumbState, public context: ThumbCtx) { }

    public $updateProps(d: Diff<ThumbProps>) {
        handleDiff(d, {
            url: value => {
                this.context.img1.src = value;
                runtime.updateState(this, { imageLoaded: false });
            }
        });
    }

    public $updateState(d: Diff<ThumbState>) {
        const { context: { div1, img1 } } = this;
        handleDiff(d, {
            imageLoaded: loaded => {
                if (loaded) {
                    div1.innerHTML = '';
                    div1.appendChild(img1);
                } else {
                    div1.innerHTML = '<div className="preloader" />';
                }
            },
            img: _value => { throw new Error('img is defined as a const'); }
        });
    }

    public $afterMount() {
        const { state, props } = this;
        state.img.src = props.url;
        state.img.onload = () => runtime.updateState(this, { imageLoaded: true });
    }

    public $afterUpdate() {
        if (this.state.img.src !== this.props.url) {
            this.state.img.src = this.props.url;
            runtime.updateState(this, {imageLoaded: false});
        }
    }
}

export const runExample = (target: HTMLElement) => {
    runtime.render(target, ThumbFactory, { url: 'https://i.imgur.com/2Feh8RD.jpg' });
};
