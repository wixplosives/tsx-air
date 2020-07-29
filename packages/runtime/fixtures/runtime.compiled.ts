import { getInstance, store, Component, Fragment, VirtualElement } from '@tsx-air/runtime';
import { RenderTarget } from '@tsx-air/framework';

export class CompiledParent extends Component {
    static render(props: any, target?: HTMLElement, add?: RenderTarget) {
        return Component._render(getInstance(), CompiledParent as any, props, target, add);
    }
    public preRender(): VirtualElement<any> {
        const { $props: props } = this.stores;
        const state = store({ counter: 0 }, this, 'state');

        state.counter++;
        if (props.a < 0) {
            return VirtualElement.fragment('0', ParentFrag0, this, { 'props.a': props.a, '-props.a': -props.a });
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
        const { $props } = this.stores;
        const { $bits } = $props;
        const { $rt } = this;
        const mod = this.modified.get($props) || 0;

        if (mod & $bits['props.a']) {
            $rt.updateExpression(this.ctx.expressions[0], $props['props.a']);
        }
        $rt.getUpdatedInstance(this.$comp0);
    }

    get $comp0() {
        const { $props } = this.stores;
        return VirtualElement.component('0', CompiledChild, this,
            { ca: $props['props.a'], cb: $props['-props.a'] });
    }

    public hydrate(_: any, target: HTMLElement) {
        const { $props } = this.stores;
        this.hydrateExpressions([$props['props.a']], target);
        this.hydrateComponents([this.$comp0], target);
        this.ctx.root = target;
    }

    public toString(): string {
        const { $props } = this.stores;
        const r = this.unique(`<span><!--C-->${
            this.$rt.toString(this.$comp0)
            }<!--C--><!--X-->${
            this.$rt.toString($props['props.a'])
            }<!--X--></span>`);
        return r;
    }
}

export class CompiledChild extends Component {
    public preRender(): VirtualElement<typeof ChildFrag0> {
        const { $props: props } = this.stores;
        return VirtualElement.fragment('0', ChildFrag0, this, { 'props.ca': props.ca, 'props.cb': props.cb });
    }
}

export class ChildFrag0 extends Fragment {
    public updateView(): void {
        const { $props } = this.stores;
        const { $bits } = $props;
        const { $rt } = this;
        const mod = this.modified.get($props) || 0;

        if (mod & $bits['props.ca']) {
            $rt.updateExpression(this.ctx.expressions[0], $props['props.ca']);
        }
        if (mod & $bits['props.cb']) {
            $rt.updateExpression(this.ctx.expressions[1], $props['props.cb']);
        }
    }

    public hydrate(_: any, target: HTMLElement) {
        const { $props } = this.stores;
        this.hydrateExpressions([$props['props.ca'], $props['props.cb']], target);
        this.ctx.root = target;
    }

    public toString(): string {
        const { $props } = this.stores;
        const r = this.unique(`<div><!--X-->${
            this.$rt.toString($props['props.ca'])}<!--X--> <!--X-->${
            this.$rt.toString($props['props.cb'])}<!--X--></div>`);
        return r;
    }
}