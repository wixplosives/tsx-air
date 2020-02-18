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

    public abstract $$processUpdate(newProps: Props, newState: State, changeMap: number, updatesCount:number): void;

    public $afterMount(_ref: HTMLElement) {/** Noop */ }
    public $afterUnmount() {/** Noop */ }

    public *$afterUpdate(): IterableIterator<void> {/** Noop */ }
}