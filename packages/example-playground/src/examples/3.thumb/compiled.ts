import { noop, Diff, handleDiff } from '../../framework/runtime/utils';
import runtime from '../../framework/runtime';
import { Stateful } from '../../framework/types/component';
import { Factory } from '../../framework/types/factory';

interface ThumbProps { url: string; }
interface ThumbState { imageLoaded: boolean; }
interface ThumbCtx { img1?: HTMLImageElement; div1?: HTMLDivElement; root: HTMLDivElement; }

export const ThumbFactory: Factory<Thumb> = {
    unique: Symbol('ThumbFactory'),
    // all derived from the code by the compiler
    initialState: _props => ({
        imageLoaded: false
    }),
    toString: (_props, state = { imageLoaded: false }) => `<div class="thumb">
        ${state!.imageLoaded ? `No way to reference the Image as it's created in the instance` : '<div class="preloader"></div>'}
    </div>`,
    hydrate: (target, props, state?) => {
        state = state || {
            imageLoaded: false
        };
        // NOTE: we should also implement validation and error recovery in case of mismatch
        // (not shown here for the sake of simplicity)
        const context: ThumbCtx = {
            root: target as HTMLDivElement,
            // here is where the string generation approach starts to smell funny
            // depending of the state, one of those would have to be created
            img1: state.imageLoaded ? target.children[0] as HTMLImageElement : undefined,
            div1: state.imageLoaded ? undefined : target.childNodes[0] as HTMLDivElement
        };
        const instance = new Thumb(props, state, context);
        instance.$afterMount();
        return instance;
    }
};

export class Thumb implements Stateful<ThumbCtx, ThumbProps, ThumbState> {
    public $afterUpdate = noop;
    public $afterUnmount = noop;
    // user defined const
    private img = new Image();

    constructor(public readonly props: ThumbProps, public readonly state: ThumbState, public context: ThumbCtx) { }

    public $updateProps(d: Diff<ThumbProps>) {
        handleDiff(d, {
            url: noop
        });
    }

    public $updateState(d: Diff<ThumbState>) {
        const { context: { root } } = this;
        handleDiff(d, {
            imageLoaded: loaded => {
                if (loaded) {
                    root.innerHTML = '';
                    root.appendChild(this.img);
                } else {
                    root.innerHTML = '<div class="preloader" />';
                }
            }
        });
    }

    public $afterMount() {
        const { img, props } = this;
        img.src = props.url;
        img.onload = () => runtime.updateState(this, { imageLoaded: true });
    }


    public $beforeUpdate(props: ThumbProps, _state?: Partial<ThumbState>) {
        if (this.img.src !== props.url) {
            this.img.src = props.url;
            runtime.updateState(this, { imageLoaded: false });
        }
    }
}

export const runExample = (target: HTMLElement) => {
    runtime.render(target, ThumbFactory, { url: 'https://i.pinimg.com/originals/ba/ea/e4/baeae441e72112a3154f840b70b930ea.jpg' });
};