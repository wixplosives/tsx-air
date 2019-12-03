import { Factory } from './factory';

export interface Dom {
    root: HTMLElement;
}

export abstract class Component<Ctx extends Dom=Dom, Props={}, State={}> {
    public static factory: Factory<any>;
    
    constructor(
        readonly context: Ctx,
        readonly props: Props,
        readonly state: State
    ) {
        requestAnimationFrame(() => this.$afterMount(context.root));
    }

    public abstract $$processUpdate(newProps: Props, newState: State, changeMap: number): void;

    public $afterMount(_ref: HTMLElement) {/** Noop */ }
    public $afterUnmount() {/** Noop */ }

    public *$afterUpdate(): IterableIterator<void> {/** Noop */ }
}

// tslint:disable-next-line: max-classes-per-file
// export abstract class ComponentWrapper<T, Ctx, Props, State> extends Component<Ctx, State, Props> {
    
// }