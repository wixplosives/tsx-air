import { RuntimeCycle } from '../stats';
import { Component, Displayable, Fragment, VirtualElement, ExpressionDom } from '../types';
import { Runtime } from '..';
import isArray from 'lodash/isArray';
import { updateExpression as _updateExpression, asDomNodes } from './runtime.helpers';

export class Renderer {
    $stats = [] as RuntimeCycle[];

    maxDepthPerUpdate = 50;
    maxDepth = 100;

    hydrate = this.renderOrHydrate as (vElm: VirtualElement<any>, dom: HTMLElement) => Displayable;
    render = this.renderOrHydrate as (vElm: VirtualElement<any>) => Displayable;
    protected pending = new Set<Component>();
    private viewUpdatePending: boolean = false;
    private hydrating = 0;

    constructor(readonly runtime: Runtime) { }

    getUpdatedInstance = (vElm: VirtualElement<any>): Displayable => {
        const { key, parent, owner } = vElm;
        if (!key || !owner || !parent) {
            throw new Error(`Invalid VirtualElement for getInstance: no key was assigned`);
        }
        if (parent.ctx.components[key]) {
            parent.ctx.components[key].stores.$props.$set(vElm.props);
        }
        return parent.ctx.components[key] || this.render(vElm);
    };

    invalidate(instance: Displayable) {
        if (Component.is(instance)) {
            this.pending.add(instance);
            this.triggerViewUpdate();
        } else {
            (instance as Fragment).updateView();
            instance.modified = new Map();
        }
    }

    updateExpression(exp: ExpressionDom, value: any) {
        _updateExpression([exp.start as Comment, exp.end as Comment], asDomNodes(value));
    }

    toString = (x: any): string => {
        if (isArray(x)) {
            return x.map(i => this.toString(i)).join('');
        }
        if (VirtualElement.is(x)) {
            return this.getUpdatedInstance(x).toString();
        }
        return x?.toString() || '';
    };

    attr = (name: string, value: any): string => {
        if (name === 'style') {
            return `style="${this.spreadStyle(value)}"`;
        }
        if (value === !!value) {
            return value ? name : '';
        }
        return `${name}="${value}"`;
    };

    hydrateExpression = (value: any, start: Comment): ExpressionDom => {
        value = isArray(value) ? value : [value];
        let hydratedDomNode: Node = start;
        const hydrated = value
            .filter((i: any) => i !== undefined && i !== null && i !== '')
            .map((i: any) => {
                hydratedDomNode = hydratedDomNode.nextSibling!;
                if (VirtualElement.is(i)) {
                    return this.runtime.renderer.hydrate(i, hydratedDomNode as HTMLElement);
                }
                return i.toString();
            });
        if (!(hydratedDomNode.nextSibling instanceof
            // @ts-ignore
            this.runtime.Comment)) {
            throw new Error(`Hydration error: Expression does not match data. (no ending comment)`);
        }
        return {
            start,
            end: hydratedDomNode.nextSibling as Comment,
            value: hydrated
        };
    };
    
    protected triggerViewUpdate() {
        if (!this.viewUpdatePending && !this.hydrating) {
            this.viewUpdatePending = true;
            this.runtime.requestAnimationFrame(this.updateView);
        }
    }

    private spreadStyle(styleObj: string | object): string {
        if (typeof styleObj === 'string') {
            return styleObj;
        }
        let style = '';
        for (const [key, value] of Object.entries(styleObj)) {
            style = style + `${key}:${isNaN(Number(value)) ? value : (value | 0) + 'px'};`;
        }
        return style;
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
        const instance = new type(vElm.key!, vElm, this.runtime);
        if (!dom) {
            this.runtime.mockDom.innerHTML = instance.toString();
            dom = this.runtime.mockDom.children[0] as HTMLElement;
        }
        instance.hydrate(vElm, dom);
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
        const instance = (parent?.ctx.components[key] || new type(key, parent, props, this.runtime)) as Comp;
        const preRender = instance.preRender();
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
}
