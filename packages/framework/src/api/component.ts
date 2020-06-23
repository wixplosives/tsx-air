import { Component, VirtualElement } from '../types';
import { ValueOf } from '../types/type-utils';
import { CompCreator, TSXAir } from './types';

export class ComponentApi<Props> {
    constructor(readonly $instance: Component) { }
    public updateProps = (props: Props) => {
        TSXAir.runtime.update(this.$instance, -1, () => this.$instance.props = props);
    }

    public setProp = (key: keyof Props, value: ValueOf<Props>) =>
        TSXAir.runtime.update(this.$instance,
            this.$instance.changesBitMap[`props.${key}`], () =>
            this.$instance.props[key] = value);

    public getProp = (key: keyof Props) =>
        this.$instance.props[key];
}

export function render<Props>(component: CompCreator<Props> | typeof Component, props: Props, state?: object, target?: HTMLElement, add: 'append' | 'before' | 'replace' = 'append') {
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
    return new ComponentApi(comp as Component);
}