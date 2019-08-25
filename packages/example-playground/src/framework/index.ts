import { ValueOf } from './types/type-utils';
import runtime from './runtime/index';
import { CompCreator as ComponentDef } from './api/types';
import { ComponentInstance } from './types/component';
import * as delegate from './api/delegate';

class ComponentApi<Props> {
    constructor(readonly $instance: ComponentInstance<any, Props, any>, readonly rootElement: HTMLElement) { }
    public updateProps = (props: Props) => runtime.updateProps(this.$instance, props);
    public setProp = (key: keyof Props, value: ValueOf<Props>) => runtime.updateProps(this.$instance, { ...this.$instance.props, [key]: value });
    public getProp = (key: keyof Props) => this.$instance.props[key];
}

export function render<Props>(target: HTMLElement, component: ComponentDef<Props>, props: Props) {
    const comp = runtime.render(target, component.factory, props);
    return comp && new ComponentApi(comp as ComponentInstance<any, Props, any>, target);
}

export { TSXAir } from './api/types';
export { lifecycle } from './api/lifecycle';

export { delegate };
export { stats } from './api/debug-tools';