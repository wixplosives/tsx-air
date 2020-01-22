import { Component, Factory, runtime, runtimeUtils } from '@tsx-air/framework';

export interface ThumbProps { url: string; onClick?: (e: MouseEvent) => any; }
interface ThumbState { imageLoaded: boolean; }
interface ThumbCtx { img1: HTMLImageElement; div1?: HTMLDivElement; root: HTMLDivElement; }

export class Thumb extends Component<ThumbCtx, ThumbProps, ThumbState> {
    public static factory: Factory<Thumb>;
    public static readonly changeBitmask = {
        url: 1 << 0,
        onClick: 1 << 1,
        imageLoaded: 1 << 2,
    };

    public $$processUpdate(newProps: ThumbProps, newState: ThumbState, changeMap: number): void {
        runtimeUtils.handleChanges(new Map([
            [Thumb.changeBitmask.url, () => {
                runtime.updateState(this as Thumb, (state: ThumbState) => {
                    state.imageLoaded = false;
                    return Thumb.changeBitmask.imageLoaded;
                });
            }],
            [Thumb.changeBitmask.imageLoaded, () => {
                if (newState.imageLoaded) {
                    this.context.root.removeChild(this.context.div1!);
                    runtimeUtils.setStyle(this.context.img1, { display: 'block' });
                    this.context.div1 = undefined;
                } else {
                    runtimeUtils.setStyle(this.context.img1, { display: 'none' });
                    this.context.div1 = runtimeUtils.createFromString('<div class="preloader" />') as HTMLDivElement;
                    this.context.root.appendChild(this.context.div1);
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
        this.context.img1.onload = () => runtime.updateState(this as Thumb, (s: ThumbState) => { s.imageLoaded = true; return Thumb.changeBitmask.imageLoaded; });
        if (this.props.onClick) {
            this.context.root.addEventListener('click', this.props.onClick);
        }
    }
}

const initialState = (_props?: ThumbProps) => ({
    imageLoaded: false,
}) as ThumbState;

Thumb.factory = {
    unique: Symbol('ThumbFactory'),
    // all derived from the code by the compiler
    initialState,
    toString: (props, state = initialState()) => `<div class="thumb">
    ${state!.imageLoaded ? '' : '<div class="preloader"></div>'}
    <img src="${props.url}" style="display: ${state.imageLoaded ? 'block' : 'none'}" />
    </div>`,
    hydrate: (target, props, state) => {
        state = state || initialState(props);
        // NOTE: we should also implement validation and error recovery in case of mismatch
        // (not shown here for the sake of simplicity)
        const context: ThumbCtx = {
            root: target as HTMLDivElement,
            // here is where the string generation approach starts to smell funny
            // depending of the state, one of those would have to be created
            img1: (state.imageLoaded ? target.children[0] : target.children[1]) as HTMLImageElement,
            div1: state.imageLoaded ? undefined : target.children[0] as HTMLDivElement
        };
        return new Thumb(context, props, state);
    }
};