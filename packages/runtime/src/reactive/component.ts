import { VirtualElement } from './virtual.element';
import { Displayable } from './displayable';
import { store } from './store';
import { RenderTarget, TsxComponentApi } from '../api/component.external';
import { Runtime, WithUserCode } from '..';

export type AfterUnmountCb = () => void;
export type AfterMountCb = (dom: HTMLElement | Text) => AfterUnmountCb | void;
export type AfterUpdateCb = (dom: HTMLElement | Text, consecutiveDomUpdates: number) => void;

export class Component extends Displayable implements WithUserCode<VirtualElement> {
    static is(x: any): x is Component {
        return x && x instanceof Component;
    }
    static isType(x: any): x is typeof Component {
        return x && x.prototype instanceof Component;
    }
    static _render<C extends typeof Component>(runtime: Runtime, component: C, props: any, target?: HTMLElement, add?: RenderTarget) {
        if (!Component.isType(component)) {
            throw new Error(`Invalid component: not compiled as TSXAir`);
        }
        const comp = runtime.renderer.render(VirtualElement.root(component, props));
        if (target) {
            const dom = comp.domRoot;
            switch (add) {
                case 'append':
                    target.append(dom);
                    break;
                case 'before':
                    target.parentNode?.insertBefore(dom, target);
                    break;
                case 'replace':
                    target.parentNode?.insertBefore(dom, target);
                    target.remove();
            }
            comp.mounted();
        }
        return new TsxComponentApi(comp as Component);
    }

    $afterMount: AfterMountCb[] = [];
    $afterUnmount: AfterUnmountCb[] = [];
    $afterDomUpdate: AfterUpdateCb[] = [];
    consecutiveChanges = new Map<AfterUpdateCb, number>();
    volatile!: any;

    constructor(readonly key: string, public parent: Displayable | undefined, props: object, runtime: Runtime) {
        super(key, parent, runtime);
        this.volatile = { '$props': store(this, '$props', props) };
        let depth = 0;
        while (parent) {
            depth++;
            parent = parent?.owner;
        }
        const { renderer: { maxDepth } } = this.$rt;
        if (depth > maxDepth) {
            throw new Error(`Component tree too deep (over ${maxDepth})
    This is a component recursion protection - change runtime.renderer.maxDepth (or fix your code)`);
        }
    }

    toString(): string {
        return this.$rt.renderer.toString(this.userCode());
    }

    userCode(): VirtualElement {
        throw new Error(`component "userCode" not implemented: ` + this.constructor.name);
    }

    hydrate(preRendered: VirtualElement<any>, target: HTMLElement): void {
        this.ctx.root = this.$rt.renderer.hydrate(preRendered, target);
    }

    updated() {
        this.$afterDomUpdate.forEach(fn => {
            this.hasStoreChanges = false;
            const consecutiveChanges = this.consecutiveChanges.get(fn) || 0;
            fn(this.domRoot, consecutiveChanges);
            this.consecutiveChanges.set(fn,
                this.hasStoreChanges ? consecutiveChanges + 1 : 0);
        });
        this.$afterDomUpdate = [];
        this.modified = new Map();
    }

    mounted() {
        super.mounted();
        this.$afterMount.forEach(i => i(this.domRoot));
        this.updated();
    }

    unmounted() {
        super.unmounted();
        this.$afterUnmount.forEach(fn => fn());
        this.$afterUnmount = [];
    }
}