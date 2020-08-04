import { VirtualElement, Displayable, Runtime, ExpressionDom, Component, Fragment } from '..';
import isArray from 'lodash/isArray';

export class ViewUpdater {
    maxDepthPerUpdate = 50;
    private pending = new Set<Component>();
    private viewUpdatePending: boolean = false;

    constructor(readonly runtime: Runtime) { }

    getUpdatedInstance = (vElm: VirtualElement<any>): Displayable => {
        const { key, parent, owner } = vElm;
        const { runtime: { renderer: { render } } } = this;
        if (!key || !owner || !parent) {
            throw new Error(`Invalid VirtualElement for getInstance: no key was assigned`);
        }
        if (parent.ctx.components[key]) {
            parent.ctx.components[key].stores.$props.$set(vElm.props);
        }
        return parent.ctx.components[key] || render(vElm);
    };

    updateExpression = (exp: ExpressionDom, value: any) =>
        this.updateDomExpression([exp.start as Comment, exp.end as Comment], this.asDomNodes(value));

    invalidate = (instance: Displayable) => {
        if (Component.is(instance)) {
            this.pending.add(instance);
            this.triggerViewUpdate();
        } else {
            (instance as Fragment).updateView();
            instance.modified = new Map();
        }
    };

    validate = (instance: Component) => {
        this.pending.delete(instance);
    };

    *asDomNodes(values: any) {
        if (isArray(values)) {
            for (const v of values) {
                yield this.asSingleDomNode(v);
            }
        } else {
            if (values !== undefined) {
                yield this.asSingleDomNode(values);
            }
        }
    }

    private triggerViewUpdate() {
        if (!this.viewUpdatePending && !this.runtime.renderer.isHydrating) {
            this.viewUpdatePending = true;
            this.runtime.requestAnimationFrame(this.updateView);
        }
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


    private updateDomExpression(expMarkers: Comment[], values: IterableIterator<Text | HTMLElement>) {
        let first!: Node;
        for (const v of values) {
            first = first || v;
            expMarkers[1].parentNode!.insertBefore(v, expMarkers[1]);
        }
        // handle empty list
        first = first || expMarkers[1];
        while (expMarkers[0].nextSibling
            && expMarkers[0].nextSibling !== first) {
            expMarkers[0].nextSibling?.remove();
        }
    }

    private asSingleDomNode(value: any) {
        if (VirtualElement.is(value)) {
            value = this.getUpdatedInstance(value);
        }
        if (Displayable.is(value)) {
            return value.domRoot;
        }
        return new (this.runtime.Text)(value);
    }
}