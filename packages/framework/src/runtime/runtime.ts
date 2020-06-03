import { Component, Displayable, isComponent, Fragment, isComponentType, ExpressionDom } from '../types/component';
import { CompFactory, Factory } from '../types/factory';
import { RuntimeCycle } from './stats';
import { updateExpression as _updateExpression, asDomNodes, remapChangedBit } from './runtime.helpers';
import isArray from 'lodash/isArray';
import { isVirtualElement, VirtualElement } from '../types/virtual.element';

type Mutator = (obj: any) => number;

export class Runtime {
    readonly HTMLElement: typeof HTMLElement;
    readonly Text: typeof Text;
    constructor(
        readonly window: Window = globalThis.window,
        readonly requestAnimationFrame: (callback: FrameRequestCallback) => any = globalThis.requestAnimationFrame
    ) {
        this.mockDom = window?.document?.createElement('div');
        this.document = window?.document;
        this.HTMLElement = window?.HTMLElement;
        this.Text = window?.Text;
    }
    $stats = [] as RuntimeCycle[];

    readonly document: Document;
    private pending = new Map<Displayable, number>();
    private viewUpdatePending: boolean = false;
    private readonly maxDepthPerUpdate = 100;
    private hydrating = 0;
    private mockDom!: HTMLElement;
    private keyCounter = 0 | 0;

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

    updateExpression(exp: ExpressionDom, value: any) {
        _updateExpression([exp.start as Comment, exp.end as Comment], asDomNodes(value));
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
        return x?.toString() || '';
    }

    getUpdatedInstance(vElm: VirtualElement<any>): Displayable {
        const { key, owner } = vElm;
        if (!key || !owner) {
            throw new Error(`Invalid VirtualElement for getInstance: no key was assigned`);
        }
        if (key in owner.ctx.components) {
            const instance = owner.ctx.components[key];
            instance.props = vElm.props;
            this.addChange(instance, vElm.changes);
            return instance;
        } else {
            return this.render(vElm);
        }
    }
    getUniqueKey(prefix = '') {
        return `${prefix}${(this.keyCounter++).toString(36)}`;
    }

    hydrate = this.renderOrHydrate as (vElm: VirtualElement<any>, dom: HTMLElement) => Displayable;
    render = this.renderOrHydrate as (vElm: VirtualElement<any>) => Displayable;

    private renderOrHydrate(vElm: VirtualElement<any>, dom?: HTMLElement): Displayable {
        const factory = vElm.type.factory as Factory<Fragment>;
        const { key, props, state, type } = vElm;
        if (isComponentType(type)) {
            const comp = this.hydrateComponent(key!, dom, factory as CompFactory<any>, props, state);
            if (vElm.owner && key) {
                vElm.owner.ctx.components[key] = comp;
            }
            return comp;
        }
        const instance = factory.newInstance(vElm.key!, vElm);
        if (!dom) {
            this.mockDom.innerHTML = instance.toString();
            dom = this.mockDom.children[0] as HTMLElement;
        }
        instance.hydrate(vElm, dom);
        if (vElm.owner && key) {
            vElm.owner.ctx.components[key] = instance;
        }
        return instance;
    }

    hydrateExpression(value: any, start: Comment): ExpressionDom {
        value = isArray(value) ? value : [value];
        let hydratedDomNode: Node = start;
        const hydrated = value
            .filter((i: any) => i !== undefined && i !== null && i !== '')
            .map((i: any) => {
                hydratedDomNode = hydratedDomNode.nextSibling!;
                if (isVirtualElement(i)) {
                    return this.hydrate(i, hydratedDomNode as HTMLElement);
                }
                return i.toString();
            });
        return {
            start, end: hydratedDomNode.nextSibling as Comment,
            value: hydrated
        }
    }

    private hydrateComponent<Comp extends Component>(
        key: string,
        domNode: HTMLElement | undefined,
        factory: CompFactory<Comp>,
        props: any,
        state?: any
    ): Comp {
        this.hydrating++;
        const instance = factory.newInstance(key, { props, state });
        const preRender = instance.$preRender();
        // prerender already expressed in view ny toString
        this.pending.delete(instance);
        instance.ctx.root = this.renderOrHydrate(preRender, domNode);
        this.hydrating--;
        return instance;
    }

    private addChange(instance: Displayable, change: number) {
        const currentChange = (this.pending.get(instance) as number) | change;
        this.pending.set(instance, currentChange);
    }

    private removeChanges(instance: Displayable) {
        const r = (this.pending.get(instance)! | 0);
        this.pending.delete(instance);
        return r;
    }

    private updateView = () => {
        let depth = 0;
        do {
            depth++;
            const { pending } = this;
            this.pending = new Map<Displayable, number>();
            for (let [instance, changes] of pending) {
                if (isComponent(instance)) {
                    const preRender = instance.$preRender();
                    // handle prerender state changes 
                    changes |= this.removeChanges(instance);
                    preRender.changes = remapChangedBit(changes, preRender.changeBitMapping);

                    const nextRoot = this.getUpdatedInstance(preRender);
                    const root = instance.ctx.root as Displayable;
                    if (root !== nextRoot) {
                        root.getDomRoot().parentNode?.append(nextRoot.getDomRoot());
                        root.getDomRoot().remove();
                        instance.ctx.root = nextRoot as Fragment;
                        // TODO: discuss pruning strategy 
                        instance.ctx.components[nextRoot.key] = nextRoot;
                    }
                } else {
                    instance.$updateView(changes);
                }
            }
        } while (this.pending.size && depth < this.maxDepthPerUpdate);

        this.viewUpdatePending = false;
        if (this.pending.size) {
            this.triggerViewUpdate();
        }
    };

    private triggerViewUpdate() {
        if (!this.viewUpdatePending && !this.hydrating) {
            this.viewUpdatePending = true;
            this.requestAnimationFrame(this.updateView);
        }
    }
}
