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
                this.swapRoot(instance,this.getUpdatedInstance(preRender));
                this.pending.delete(instance);
                instance.updated();
            }
        } while (this.pending.size && depth < this.maxDepthPerUpdate);

        this.viewUpdatePending = false;
        if (this.pending.size) {
            this.triggerViewUpdate();
        }
    };

    private swapRoot({ ctx }: Component, nextRoot: Displayable) {
        const prevRoot = ctx.root as Displayable;
        if (prevRoot !== nextRoot) {
            prevRoot.domRoot.parentNode?.insertBefore(nextRoot.domRoot, prevRoot.domRoot);
            prevRoot.domRoot.remove();
            ctx.root = nextRoot as Fragment;
            ctx.components[prevRoot.key].unmounted();
            if (!prevRoot.stores.$props.keepAlive) {
                ctx.components[prevRoot.key].dispose();
                delete ctx.components[prevRoot.key];
            }
            ctx.components[nextRoot.key] = nextRoot;
            nextRoot.mounted();            
        }
    }

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