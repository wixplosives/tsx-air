import { Component, Factory, runtime, runtimeUtils, render } from '@tsx-air/framework';

/* tslint:disable:rule no-bitwise */

export interface ThumbProps { url: string; onClick?: (e: MouseEvent) => any; }
interface ThumbState { imageLoaded: boolean; img: HTMLImageElement; }
interface ThumbCtx { img1?: HTMLImageElement; div1?: HTMLDivElement; root: HTMLDivElement; }

export class Thumb extends Component<ThumbCtx, ThumbProps, ThumbState> {
    public static factory: Factory<Thumb>;
    public static readonly changeBitmask = {
        url: 1 << 0,
        onClick: 1 << 1,
        imageLoaded: 1 << 2,
        img: 1 << 3
    };

    public $$processUpdate(newProps: ThumbProps, newState: ThumbState, changeMap: number): void {
        runtimeUtils.handleChanges(new Map([
            [Thumb.changeBitmask.url, () => {
                runtime.updateState(this as Thumb, (state: ThumbState) => {
                    // User code
                    state.img.src = newProps.url;
                    state.imageLoaded = false;
                    return Thumb.changeBitmask.imageLoaded;
                });
            }],
            [Thumb.changeBitmask.imageLoaded, () => {
                if (newState.imageLoaded) {
                    this.context.root.innerHTML = '';
                    this.context.root.appendChild(newState.img);
                } else {
                    this.context.root.innerHTML = '<div class="preloader" />';
                }
            }],
            [Thumb.changeBitmask.onClick, () => {
                if (this.props.onClick) {
                    this.context.root.removeEventListener('click', this.props.onClick);
                }
                if (newProps.onClick) {
                    this.context.root.addEventListener('click', newProps.onClick);
                }
            }]
        ]), changeMap);
    }

    public $afterMount() {
        const { props, state } = this;
        state.img.src = props.url;
        state.img.onload = () => runtime.updateState(this as Thumb, (s: ThumbState) => { s.imageLoaded = true; return Thumb.changeBitmask.imageLoaded; });
        if (this.props.onClick) {
            this.context.root.addEventListener('click', this.props.onClick);
        }
    }
}

const initialState = (_props?: ThumbProps) => ({
    imageLoaded: false,
    img: new Image()
}) as ThumbState;

Thumb.factory = {
    unique: Symbol('ThumbFactory'),
    // all derived from the code by the compiler
    initialState,
    toString: (_props, state = initialState()) => `<div class="thumb">
        ${state!.imageLoaded ? `No way to reference the Image as it's created in the instance` : '<div class="preloader"></div>'}
    </div>`,
    hydrate: (target, props, state) => {
        state = state || initialState(props);
        // NOTE: we should also implement validation and error recovery in case of mismatch
        // (not shown here for the sake of simplicity)
        const context: ThumbCtx = {
            root: target as HTMLDivElement,
            // here is where the string generation approach starts to smell funny
            // depending of the state, one of those would have to be created
            img1: state.imageLoaded ? target.children[0] as HTMLImageElement : undefined,
            div1: state.imageLoaded ? undefined : target.childNodes[0] as HTMLDivElement
        };
        return new Thumb(context, props, state);
    }
};


export const runExample = (target: HTMLElement) => {
    render(target, Thumb as any, { url: '/images/prettyboy.jpg'});
};
