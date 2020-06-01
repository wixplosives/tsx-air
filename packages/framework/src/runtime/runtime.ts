import { Component, Dom, Displayable, isComponent, Fragment, isVirtualElement, VirtualElement, DomMarker } from '../types/component';
import { CompFactory } from '../types/factory';
import { RuntimeCycle } from './stats';
import { updateExpression, asDomNodes } from './runtime.helpers';
import isArray from 'lodash/isArray';

type Mutator = (obj: any) => number;

export class Runtime {
    $stats = [] as RuntimeCycle[];

    private pending = new Map<Displayable, number>();

    private viewUpdatePending: boolean = false;
    private readonly maxDepthPerUpdate = 100;

    $tick = globalThis.requestAnimationFrame
        ? (fn: FrameRequestCallback) => globalThis.requestAnimationFrame(fn)
        : (fn: FrameRequestCallback) => globalThis.process.nextTick(fn);
    
    private mockDom = globalThis.document?.createElement('div');
    private keyCounter = 0|0;

    execute<Comp extends Component>(instance: Comp, method: (...args: any[]) => any, ...args: any[]) {
        return method.apply(instance, [instance.props, instance.state, instance.volatile, ...args]);
    }

    updateProps(instance: Displayable, mutator: Mutator) {
        this.addChange(instance, mutator(instance.props));
        this.triggerViewUpdate();
    }

    updateState(instance: Displayable, mutator: Mutator) {
        this.addChange(instance, mutator(instance.state));
        this.triggerViewUpdate();
    }

    renderComponent<Ctx extends Dom, Comp extends Component<Ctx>>(
        key:string,
        factory: CompFactory<Comp>,
        props: any,
        state?: any
    ): Comp {
        state = state || factory?.initialState(props) || {};
        const instance = factory.newInstance(key, props, state);
        const vElm = instance.$preRender();
        instance.ctx.root = this.getUpdatedInstance(vElm);
        return instance;
    }

    setExpValue(exp: DomMarker, value: any) {
        updateExpression([exp.start as Comment, exp.end as Comment], asDomNodes(value));
    }

    toString(x: any): string {
        if (isArray(x)) {
            return x.map(i => this.toString(i)).join('');
        }
        if (isVirtualElement(x)) {
            return this.getUpdatedInstance(x).toString();
        }
        if (isComponent(x)) {
            this.toString(x.$preRender());
        }
        return x.toString();
    }

    getUpdatedInstance(vElm: VirtualElement): Displayable {
        const { key, owner } = vElm;
        if (!key) {
            throw new Error(`Invalid VirtualElement for getInstance: no key was assigned`);
        }
        if (key in owner.ctx) {
            const instance = (owner.ctx as any)[key];
            this.updateProps(instance, () => vElm.modified);
            return instance;
        } else {
            return this.renderNew(vElm);
        }
    }

    getUniqueKey(prefix=''){
        return `${prefix}${(this.keyCounter++).toString(36)}`;
    }

    private renderNew(vElm: VirtualElement): Displayable {
        const factory = vElm.type.factory as CompFactory<any>;
        const { props,key } = vElm;
        const state = vElm.state || factory?.initialState(props) || {};
        const instance = factory.newInstance(key!, props, state);
        (vElm.owner.ctx as any)[key!] = instance;
        if (isComponent(instance)) {
            const innerVElm = instance.$preRender();
            const asString = this.toString(innerVElm);
            this.mockDom.innerHTML = asString;
            instance.hydrate(this.mockDom.children[0]);
            this.mockDom.children[0].remove();
        }
        instance.ctx.root = this.getUpdatedInstance(vElm);
        return instance;
    }

    private addChange(instance: Displayable, change: number) {
        const currentChange = (this.pending.get(instance) as number) | change;
        this.pending.set(instance, currentChange);
    }

    private updateView = () => {
        const stateTime = performance.now();
        let depth = 0;
        const changed = new Map<Displayable, number>();
        do {
            depth++;
            const { pending } = this;
            this.pending = new Map<Displayable, number>();
            for (let [instance, changes] of pending) {
                if (isComponent(instance)) {
                    const res = instance.$preRender();
                    if (this.pending.has(instance)) {
                        changes |= (this.pending.get(instance)! | 0);
                        this.pending.delete(instance);
                    }

                    const nextRoot = this.getUpdatedInstance(res);
                    const root = instance.ctx.root as Displayable;
                    if (root === nextRoot) {
                        nextRoot.$updateView(changes);
                    } else {
                        root.getDomRoot().parentNode?.append(nextRoot.getDomRoot());
                        root.getDomRoot().remove();
                        instance.ctx.root = nextRoot as Fragment;
                    }
                } else {
                    instance.$updateView(changes)
                }
            }
        } while (depth < this.maxDepthPerUpdate && this.pending.size);

        this.viewUpdatePending = false;
        if (this.pending.size) {
            this.triggerViewUpdate();
        }

        this.$stats.push({
            stateTime,
            endTime: performance.now(),
            changed: changed.size,
            depth
        });
    };

    private triggerViewUpdate() {
        if (!this.viewUpdatePending) {
            this.viewUpdatePending = true;
            this.$tick(this.updateView);
        }
    }
}
