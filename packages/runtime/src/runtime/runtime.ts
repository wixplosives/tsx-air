import { RuntimeCycle } from '../stats';
import { updateExpression as _updateExpression, asDomNodes } from './runtime.helpers';
import isArray from 'lodash/isArray';
import { Component, Displayable, Fragment, ExpressionDom, VirtualElement } from '../types';
import { StoreData, Store } from '../store';

export class Runtime {
    readonly HTMLElement: typeof HTMLElement;
    readonly Text: typeof Text;
    $stats = [] as RuntimeCycle[];

    readonly document: Document;
    maxDepthPerUpdate = 50;
    maxDepth = 100;


    hydrate = this.renderOrHydrate as (vElm: VirtualElement<any>, dom: HTMLElement) => Displayable;
    render = this.renderOrHydrate as (vElm: VirtualElement<any>) => Displayable;
    private previousPredicates = new Map<Component, Record<number, any>>();
    private pending = new Set<Component>();
    private viewUpdatePending: boolean = false;
    private hydrating = 0;
    private mockDom!: HTMLElement;
    private keyCounter = 0 | 0;
    private stores = new WeakMap<any, Record<string, Store>>();

    constructor(
        readonly window: Window = globalThis.window,
        readonly requestAnimationFrame: (callback: FrameRequestCallback) => any = globalThis.requestAnimationFrame
    ) {
        this.mockDom = window?.document?.createElement('div');
        this.document = window?.document;
        // @ts-ignore
        this.HTMLElement = window?.HTMLElement;
        // @ts-ignore
        this.Text = window?.Text;
        if (requestAnimationFrame !== undefined) {
            this.requestAnimationFrame = requestAnimationFrame.bind(globalThis);
        }
    }

    when(predicate: any, action: () => void, target: Component, id: number) {
        const previousTargetPredicates = this.previousPredicates.get(target) || {};

        const update = () => {
            this.previousPredicates.set(target, previousTargetPredicates);
            previousTargetPredicates[id] = predicate;
            return action();
        };
        if (this.previousPredicates.has(target) && id in previousTargetPredicates) {
            const previous = previousTargetPredicates[id];
            if (previous === predicate) {
                return;
            }
            if (isArray(previous)) {
                if (previous.length === predicate.length &&
                    previous.every((v, i) => v === predicate[i])) {
                    return;
                }
            }
        }
        return update();
    }

    invalidate(instance: Displayable) {
        if (Component.is(instance)) {
            this.pending.add(instance);
            this.triggerViewUpdate();
        } else {
            (instance as Fragment).updateView();
            instance.modified = new Map();
        }
    }

    registerStore<T extends StoreData>(instance: any, name: string, store: Store<T>) {
        const instanceStores = this.stores.get(instance) || {};
        instanceStores[name] = store;
        if (Component.is(instance)) {
            if (instance.stores) {
                instance.stores[name] = store;
            }
            store.$subscribe(instance.storeChanged);
        }
        this.stores.set(instance, instanceStores);
    }

    getStore(instance: any, name: string) {
        const instanceStores = this.stores.get(instance);
        return instanceStores && instanceStores[name];
    }

    updateExpression(exp: ExpressionDom, value: any) {
        exp.value = value;
        _updateExpression([exp.start as Comment, exp.end as Comment], asDomNodes(value));
    }

    toString(x: any): string {
        if (isArray(x)) {
            return x.map(i => this.toString(i)).join('');
        }
        if (VirtualElement.is(x)) {
            return this.getUpdatedInstance(x).toString();
        }
        return x?.toString() || '';
    }

    getUpdatedInstance(vElm: VirtualElement<any>): Displayable {
        const { key, parent, owner } = vElm;
        if (!key || !owner || !parent) {
            throw new Error(`Invalid VirtualElement for getInstance: no key was assigned`);
        }
        if (Component.is(parent.ctx.components[key])) {
            parent.ctx.components[key].stores.$props.$set(vElm.props);
        }
        return parent.ctx.components[key] || this.render(vElm);
    }

    getUniqueKey(prefix = '') {
        return `${prefix}${(this.keyCounter++).toString(36)}`;
    }

    spreadStyle(styleObj: string | object): string {
        if (typeof styleObj === 'string') {
            return styleObj;
        }
        let style = '';
        for (const [key, value] of Object.entries(styleObj)) {
            style = style + `${key}:${isNaN(Number(value)) ? value : (value | 0) + 'px'};`;
        }
        return style;
    }

    hydrateExpression(value: any, start: Comment): ExpressionDom {
        value = isArray(value) ? value : [value];
        let hydratedDomNode: Node = start;
        const hydrated = value
            .filter((i: any) => i !== undefined && i !== null && i !== '')
            .map((i: any) => {
                hydratedDomNode = hydratedDomNode.nextSibling!;
                if (VirtualElement.is(i)) {
                    return this.hydrate(i, hydratedDomNode as HTMLElement);
                }
                return i.toString();
            });
        if (
            !(
                hydratedDomNode.nextSibling instanceof
                // @ts-ignore
                this.window.Comment
            )
        ) {
            throw new Error(`Hydration error: Expression does not match data. (no ending comment)`);
        }
        return {
            start,
            end: hydratedDomNode.nextSibling as Comment,
            value: hydrated
        };
    }

    private renderOrHydrate(vElm: VirtualElement<any>, dom?: HTMLElement): Displayable {
        const { key, props, type, parent } = vElm;
        if (Component.isType(type)) {
            const comp = this.hydrateComponent(key!, parent, dom, type, props);
            if (vElm.parent && key) {
                vElm.parent.ctx.components[key] = comp;
            }
            return comp;
        }
        const instance = new type(vElm.key!, vElm, this);
        if (!dom) {
            this.mockDom.innerHTML = instance.toString();
            dom = this.mockDom.children[0] as HTMLElement;
        }
        instance.hydrate(vElm, dom);
        instance.updateReadBits();
        if (vElm.parent && key) {
            vElm.parent.ctx.components[key] = instance;
        }
        return instance;
    }

    private hydrateComponent<Comp extends Component>(
        key: string,
        parent: Displayable | undefined,
        domNode: HTMLElement | undefined,
        type: typeof Component,
        props: any
    ): Comp {
        this.hydrating++;
        const instance = (parent?.ctx.components[key] || new type(key, parent, props, this)) as Comp;
        const preRender = instance.preRender();
        instance.updateReadBits();
        // prerender already expressed in view ny toString
        this.pending.delete(instance);
        instance.ctx.root = this.renderOrHydrate(preRender, domNode);
        this.hydrating--;
        return instance;
    }

    private updateView = (_: number) => {
        let depth = 0;
        do {
            depth++;
            const { pending } = this;
            this.pending = new Set<Component>();
            for (const instance of pending) {
                const preRender = instance.preRender();
                instance.updateReadBits();

                const nextRoot = this.getUpdatedInstance(preRender);
                const root = instance.ctx.root as Displayable;
                if (root !== nextRoot) {
                    root.domRoot.parentNode?.insertBefore(nextRoot.domRoot, root.domRoot);
                    root.domRoot.remove();
                    instance.ctx.root = nextRoot as Fragment;
                    if (!root.stores.$props.keepAlive) {
                        instance.ctx.components[root.key].dispose();
                        delete instance.ctx.components[root.key];
                    }
                    instance.ctx.components[nextRoot.key] = nextRoot;
                }
                instance.modified = new Map();
                this.pending.delete(instance);
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
