import { CompFactory } from './factory';
import { TSXAir } from '../api/types';
import { VirtualElement } from './virtual.element';
import { Displayable } from './displayable';

export class Component extends Displayable {
    static factory: CompFactory<any>;
    static is(x: any): x is Component {
        return x && x instanceof Component;
    }
    static isType(x: any): x is typeof Component {
        return x && x.prototype instanceof Component;
    }

    constructor(
        readonly key: string,
        parent: Displayable | undefined,
        props: any,
        state: any,
        volatile = {}
    ) {
        super(key, parent, props, state, volatile,);
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

    toString(): string {
        return TSXAir.runtime.toString(this.preRender());
    }

    preRender(): VirtualElement<any> { throw new Error(`not implemented`); }

    hydrate(preRendered: VirtualElement<any>, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }
}
