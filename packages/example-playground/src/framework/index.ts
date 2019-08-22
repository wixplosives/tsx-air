import runtime from './runtime/index';
import { CompCreator as ComponentDef } from './api/types';
import { ComponentInstance } from './types/component';

class ComponentApi<Props> {
    constructor(readonly $instance: ComponentInstance<any, Props, any>, readonly rootElement: HTMLElement) { }
    public updateProps = (props: Props) => runtime.updateProps(this.$instance, props);
}

export function render<Props>(target: HTMLElement, component: ComponentDef<Props>, props: Props) {
    const comp = runtime.render(target, component.factory, props);
    return comp && new ComponentApi(comp as ComponentInstance<any, Props, any>, target);
}

export { TSXAir } from './api/types';
export { lifecycle } from './api/lifecycle';