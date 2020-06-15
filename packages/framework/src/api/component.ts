import runtime from '../runtime';
import { Component, VirtualElement } from '../types';
import { setProp } from '../runtime/utils';
import { ValueOf } from '../types/type-utils';
import { CompCreator } from './types';

export class ComponentApi<Props> {
    constructor(readonly $instance: Component) { }
    public updateProps = (props: Props) => {
        this.$instance.props = props;
        debugger
        runtime.updateProps(this.$instance, _ => -1|0);
    }
    
    public setProp = (key: keyof Props, value: ValueOf<Props>) =>
        runtime.updateProps(this.$instance, props => {
            props[key] = value;
            return this.$instance.changesBitMap[`props.${key}`];
        });

    public getProp = (key: keyof Props) =>
        // @ts-ignore
        this.$instance.props[key];
}

export function render<Props>(component: CompCreator<Props>, props: Props, state = {}, target?: HTMLElement, add: 'append' | 'before' | 'replace' = 'append') {
    if (!Component.isType(component)) {
        throw new Error(`Invalid component: not compiled as TSXAir`);
    }
    const comp = runtime.render(VirtualElement.root(component, props, state));
    if (target) {
        const dom = comp.getDomRoot();
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
    return new ComponentApi(comp as Component);
}