import { CompFactory, RenderTarget } from './factory';
import { TSXAir } from '../api/types';
import { VirtualElement } from './virtual.element';
import { Displayable } from './displayable';
import { ComponentApi, TsxComponentApi } from '../api/component';
import { CompiledStore } from '../api/store';

export class Component extends Displayable {
    public static factory: CompFactory<any>;

    public static is(x: any): x is Component {
        return x && x instanceof Component;
    }
    public static isType(x: any): x is typeof Component {
        return x && x.prototype instanceof Component;
    }
    public static render<C extends typeof Component>(component: C, props: any, state: any, target?: HTMLElement, add?: RenderTarget) {
        if (!Component.isType(component)) {
            throw new Error(`Invalid component: not compiled as TSXAir`);
        }
        const comp = TSXAir.runtime.render(VirtualElement.root(component, props, state));
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
    public modified: Map<CompiledStore, number> = new Map();
    public stores!: Record<string, CompiledStore>;
    public factory!: CompFactory<any>;
    constructor(readonly key: string, parent: Displayable | undefined, props: any) {
        super(key, parent, props);
        let depth = 0;
        while (parent) {
            depth++;
            parent = parent?.owner;
        }
        if (depth > TSXAir.runtime.maxDepth) {
            throw new Error(`Component tree too deep (over ${TSXAir.runtime.maxDepth})
    This is a component recursion protection - change TSXAir.runtime.maxDepth (or fix your code)`);
        }
    }
    public store = (data: any, name: string) => {
        if (!this.stores[name]) {
            this.stores[name] =  new this.factory.stores[name](data);
            this.stores[name].$subscribe(this.storeChanged);
        }
        return this.stores[name];
    };
    public storeChanged = (store: CompiledStore, changed: number) => {
        this.modified.set(store, (this.modified.get(store) || 0) | changed);
        TSXAir.runtime.invalidate(this);
    };

    public toString(): string {
        return TSXAir.runtime.toString(this.preRender());
    }

    public preRender(): VirtualElement<any> {
        throw new Error(`not implemented`);
    }

    public hydrate(preRendered: VirtualElement<any>, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }
}
