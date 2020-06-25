import { RuntimeCycle } from './stats';
import { updateExpression as _updateExpression, asDomNodes, remapChangedBit } from './runtime.helpers';
import isArray from 'lodash/isArray';
import { Component, Displayable, Fragment, ExpressionDom, VirtualElement } from '..';

type Mutator = () => any;

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
        if (requestAnimationFrame !== undefined) {
            this.requestAnimationFrame = requestAnimationFrame.bind(globalThis);
        }
    }
    $stats = [] as RuntimeCycle[];

    readonly document: Document;
    private pending = new Map<Displayable, number>();
    private viewUpdatePending: boolean = false;
    public maxDepthPerUpdate = 50;
    public maxDepth = 100;
    private hydrating = 0;
    private mockDom!: HTMLElement;
    private keyCounter = 0 | 0;

    update(instance: Displayable, bits: number, mutator: Mutator) {
        this.addChange(instance, bits);
        this.triggerViewUpdate();
        return mutator();
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
        if (key in parent.ctx.components) {
            const instance = parent.ctx.components[key];
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

    when: (predicate: string[], action: () => void) => void = this.always;
    private always(_: any, action: () => void) {
        action();
    }

    spreadStyle(styleObj: string | object): string {
        if (typeof styleObj === 'string') {
            return styleObj;
        }
        let style = ''
        for (const [key, value] of Object.entries(styleObj)) {
            style = style + `${key}:${isNaN(Number(value)) ? value : (value | 0) + 'px'};`;
        }
        return style;
    }

    hydrate = this.renderOrHydrate as (vElm: VirtualElement<any>, dom: HTMLElement) => Displayable;
    render = this.renderOrHydrate as (vElm: VirtualElement<any>) => Displayable;

    private renderOrHydrate(vElm: VirtualElement<any>, dom?: HTMLElement): Displayable {
        const { key, props, state, type, parent } = vElm;
        if (Component.isType(type)) {
            const comp = this.hydrateComponent(key!, parent, dom, type, props, state);
            if (vElm.parent && key) {
                vElm.parent.ctx.components[key] = comp;
            }
            return comp;
        }
        const instance = type.factory.newInstance(vElm.key!, vElm);
        if (!dom) {
            this.mockDom.innerHTML = instance.toString();
            dom = this.mockDom.children[0] as HTMLElement;
        }
        instance.hydrate(vElm, dom);
        if (vElm.parent && key) {
            vElm.parent.ctx.components[key] = instance;
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
                if (VirtualElement.is(i)) {
                    return this.hydrate(i, hydratedDomNode as HTMLElement);
                }
                return i.toString();
            });
        if (!(hydratedDomNode.nextSibling instanceof
            //@ts-ignore
            this.window.Comment)) {
            throw new Error(`Hydration error: Expression does not match data. (no ending comment)`);
        }
        return {
            start, end: hydratedDomNode.nextSibling as Comment,
            value: hydrated
        }
    }

    private hydrateComponent<Comp extends Component>(
        key: string,
        parent: Displayable | undefined,
        domNode: HTMLElement | undefined,
        type: typeof Component,
        props: any,
        state?: any
    ): Comp {
        this.hydrating++;
        const instance = parent?.ctx.components[key] || type.factory.newInstance(key, { props, state, parent });
        const preRender = instance.preRender();
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

    private updateView = (_: number) => {
        let depth = 0;
        do {
            depth++;
            const { pending } = this;
            this.pending = new Map<Displayable, number>();
            for (let [instance, changes] of pending) {
                if (Component.is(instance)) {
                    this.when = (predicate, action) => {
                        if (predicate.some(p => changes & instance.changesBitMap[p])) {
                            action();
                        }
                    }
                    const preRender = instance.preRender();
                    this.when = this.always;
                    // handle prerender state changes 
                    changes |= this.removeChanges(instance);
                    preRender.changes = remapChangedBit(changes, preRender.changeBitMapping);

                    const nextRoot = this.getUpdatedInstance(preRender);
                    const root = instance.ctx.root as Displayable;
                    if (root !== nextRoot) {
                        root.domRoot.parentNode?.insertBefore(nextRoot.domRoot, root.domRoot);
                        root.domRoot.remove();
                        instance.ctx.root = nextRoot as Fragment;
                        if (!root.props.keepAlive) {
                            instance.ctx.components[root.key].dispose();
                            delete instance.ctx.components[root.key]
                        }
                        instance.ctx.components[nextRoot.key] = nextRoot;
                    }
                } else {
                    (instance as Fragment).updateView(changes);
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
