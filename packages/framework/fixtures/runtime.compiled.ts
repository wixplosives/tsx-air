import { Component, CompFactory, TSXAir, Factory } from '../src';
import { VirtualElement } from '../src/types/virtual.element';
import { Fragment } from '../src/types/fragment';

export class CompiledParent extends Component {
    public static factory: CompFactory<typeof CompiledParent> = new CompFactory<typeof CompiledParent>(CompiledParent, {
        'props.a': 1,
        'state.counter': 2
    }, () => ({ state: { counter: 0 } }));

    public preRender(): VirtualElement<any> {
        const { state } = this.state;
        TSXAir.runtime.update(this, this.changesBitMap['state.counter'], () => {
            return state.counter++;
        });
        if (this.props.a < 0) {
            return VirtualElement.fragment('0', ParentFrag0, this);
        }
        if (this.props.a < 5) {
            return VirtualElement.component('1', CompiledParent, this, undefined, { a: this.props.a + 1 });
        }
        return VirtualElement.component(
            '2', CompiledChild, this,
            new Map<number, number>([
                [CompiledChild.factory.changesBitMap['props.ca'], this.changesBitMap['state.counter']],
                [CompiledChild.factory.changesBitMap['props.cb'], this.changesBitMap['props.a']],
            ]), { ca: this.props.a, cb: this.state.state.counter });
    }
}
// tslint:disable:max-classes-per-file
export class ParentFrag0 extends Fragment {
    public static factory: Factory<typeof ParentFrag0> = new Factory<typeof ParentFrag0>(
        ParentFrag0, CompiledParent.factory.changesBitMap);
    public updateView(changes: number): void {
        if (changes & this.changesBitMap['props.a']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.a);
        }
        if (changes & this.changesBitMap['props.a']) {
            TSXAir.runtime.getUpdatedInstance(this.$comp0.withChanges(changes));
        }
    }

    get $comp0() {
        const { props } = this;
        return VirtualElement.component('0', CompiledChild, this,
            new Map<number, number>(
                [
                    [CompiledChild.factory.changesBitMap['props.ca'], this.changesBitMap['props.a']],
                    [CompiledChild.factory.changesBitMap['props.cb'], this.changesBitMap['props.a']]
                ]), { ca: props.a, cb: -props.a });
    }

    public hydrate(_: any, target: HTMLElement) {
        const { props } = this;
        this.hydrateExpressions([props.a], target);
        this.hydrateComponents([this.$comp0], target);
        this.ctx.root = target;
    }

    public toString(): string {
        const r = this.unique(`<span><!--C-->${
            TSXAir.runtime.toString(this.$comp0)
            }<!--C--><!--X-->${
            TSXAir.runtime.toString(this.props.a)
            }<!--X--></span>`);
        return r;
    }
}

export class CompiledChild extends Component {
    public static factory: CompFactory<typeof CompiledChild> = new CompFactory<typeof CompiledChild>(CompiledChild, {
        'props.ca': 4, 'props.cb': 8
    });

    public preRender(): VirtualElement<typeof ChildFrag0> {
        return VirtualElement.fragment('0', ChildFrag0, this);
    }
}

export class ChildFrag0 extends Fragment {
    public static factory: Factory<typeof ChildFrag0> = new Factory<typeof ChildFrag0>(
        ChildFrag0, CompiledChild.factory.changesBitMap);
    public updateView(changes: number): void {
        if (changes & this.changesBitMap['props.ca']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[0], this.props.ca);
        }
        if (changes & this.changesBitMap['props.cb']) {
            TSXAir.runtime.updateExpression(this.ctx.expressions[1], this.props.cb);
        }
    }

    public hydrate(_: any, target: HTMLElement) {
        const { props } = this;
        this.hydrateExpressions([props.ca, props.cb], target);
        this.ctx.root = target;
    }

    public toString(): string {
        const r = this.unique(`<div><!--X-->${
            TSXAir.runtime.toString(this.props.ca)}<!--X--> <!--X-->${
            TSXAir.runtime.toString(this.props.cb)}<!--X--></div>`);
        return r;
    }
}