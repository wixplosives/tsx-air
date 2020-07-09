import { VirtualElement } from './virtual.element';
import { Displayable } from './displayable';
import { store } from '../store';
import { getInstance as $rt } from '../';
import { RenderTarget, TsxComponentApi } from '@tsx-air/framework';

export class Component extends Displayable {
    static is(x: any): x is Component {
        return x && x instanceof Component;
    }
    static isType(x: any): x is typeof Component {
        return x && x.prototype instanceof Component;
    }
    static _render<C extends typeof Component>(component: C, props: any, target?: HTMLElement, add?: RenderTarget) {
        if (!Component.isType(component)) {
            throw new Error(`Invalid component: not compiled as TSXAir`);
        }
        const comp = $rt().render(VirtualElement.root(component, props));
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
        }
        return new TsxComponentApi(comp as Component);
    }

    constructor(readonly key: string, public parent: Displayable | undefined, props: object) {
        super(key, parent);
        this.stores = { $props: store(props, this, '$props') };
        let depth = 0;
        while (parent) {
            depth++;
            parent = parent?.owner;
        }
        if (depth > $rt().maxDepth) {
            throw new Error(`Component tree too deep (over ${$rt().maxDepth})
    This is a component recursion protection - change $rt().maxDepth (or fix your code)`);
        }
    }

    toString(): string {
        return $rt().toString(this.preRender());
    }

    preRender(): VirtualElement<any> {
        throw new Error(`not implemented`);
    }

    hydrate(preRendered: VirtualElement<any>, target: HTMLElement): void {
        this.ctx.root = $rt().hydrate(preRendered, target);
    }
}

