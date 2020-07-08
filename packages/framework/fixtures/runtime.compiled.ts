import { Component, TSXAir, ComponentApi } from '../src';
import { VirtualElement } from '../src/types/virtual.element';
import { Fragment } from '../src/types/fragment';
import { RenderTarget } from '../src/types/factory';
import { store } from '../src/runtime/store';

export class CompiledParent extends Component {
    static render(props: any, target?: HTMLElement, add?: RenderTarget) {
        return Component._render(CompiledParent as any, props, target, add) as ComponentApi<CompiledParent>;
    }
    public preRender(): VirtualElement<any> {
        const { props } = this.stores;
        const state = store({ counter: 0 }, this, 'state');
        
        state.counter++;
        if (props.a < 0) {
            return VirtualElement.fragment('0', ParentFrag0, this);
        }
        if (props.a < 5) {
            return VirtualElement.component('1', CompiledParent, this, { a: props.a + 1 });
        }
        return VirtualElement.component(
            '2', CompiledChild, this,
            { ca: props.a, cb: state.counter });
    }
}
// tslint:disable:max-classes-per-file
export class ParentFrag0 extends Fragment {
    public updateView(): void {
        const { props } = this.stores;
        if ((this.modified.get(props) || 0) & props.$bits.a) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], props.a);
        }
        if ((this.modified.get(props) || 0) & props.$bits.a) {
            TSXAir.runtime.getUpdatedInstance(this.$comp0);
        }
    }

    get $comp0() {
        const { props } = this.stores;
        return VirtualElement.component('0', CompiledChild, this,
            { ca: props.a, cb: -props.a });
    }

    public hydrate(_: any, target: HTMLElement) {
        const { props } = this.stores;
        this.hydrateExpressions([props.a], target);
        this.hydrateComponents([this.$comp0], target);
        this.ctx.root = target;
    }

    public toString(): string {
        const { props } = this.stores;
        const r = this.unique(`<span><!--C-->${
            TSXAir.runtime.toString(this.$comp0)
            }<!--C--><!--X-->${
            TSXAir.runtime.toString(props.a)
            }<!--X--></span>`);
        return r;
    }
}

export class CompiledChild extends Component {
    public preRender(): VirtualElement<typeof ChildFrag0> {
        return VirtualElement.fragment('0', ChildFrag0, this);
    }
}

export class ChildFrag0 extends Fragment {
    public updateView(): void {
        const { props } = this.stores;
        if ((this.modified.get(props) || 0) & props.$bits.ca) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], props.ca);
        }
        if ((this.modified.get(props) || 0) & props.$bits.cb) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[1], props.cb);
        }
    }

    public hydrate(_: any, target: HTMLElement) {
        const { props } = this.stores;
        this.hydrateExpressions([props.ca, props.cb], target);
        this.ctx.root = target;
    }

    public toString(): string {
        const { props } = this.stores;
        const r = this.unique(`<div><!--X-->${
            TSXAir.runtime.toString(props.ca)}<!--X--> <!--X-->${
            TSXAir.runtime.toString(props.cb)}<!--X--></div>`);
        return r;
    }
}