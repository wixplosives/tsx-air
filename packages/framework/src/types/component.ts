import { Factory } from './factory';

export interface Dom {
    root: HTMLElement;
}

export abstract class Component<Ctx extends Dom = Dom, Props = {}, State = {}> {
    public static factory: Factory<any>;

    constructor(
        readonly context: Ctx,
        readonly props: Props,
        readonly state: State
    ) {
        requestAnimationFrame(() => this.$afterMount(context.root));
    }

    public abstract $updateView(newProps: Props, newState: State, volatile: any, changeMap: number): void;

    public $afterMount(_ref: HTMLElement) {/** Noop */ }
    public $afterUnmount() {/** Noop */ }
    public *$afterUpdate(): IterableIterator<void> {/** Noop */ }
    public $preRender(_prop: Props, _state: State) { return {}; }
}