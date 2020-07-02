import { CompFactory, RenderTarget } from './factory';
import { TSXAir } from '../api/types';
import { VirtualElement } from './virtual.element';
import { Displayable } from './displayable';
import { ComponentApi } from '../api/component';

export class Component extends Displayable {
    public static factory: CompFactory<any>;
    public static render: <PROPS=any>(_props:object, _state?:object, _target?:HTMLElement, _add?:RenderTarget)=>ComponentApi<PROPS>;
    public static is(x: any): x is Component {
        return x && x instanceof Component;
    }
    public static isType(x: any): x is typeof Component {
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

    public toString(): string {
        return TSXAir.runtime.toString(this.preRender());
    }

    public preRender(): VirtualElement<any> { throw new Error(`not implemented`); }

    public hydrate(preRendered: VirtualElement<any>, target: HTMLElement): void {
        this.ctx.root = TSXAir.runtime.hydrate(preRendered, target);
    }
}
