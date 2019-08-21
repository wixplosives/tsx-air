import runtime from './runtime/index';
import { TsxAirNode } from './api/types';
import { ComponentInstance } from './types/component';

class ComponentApi<Props> {
    constructor(readonly $instance:ComponentInstance<any, Props, any>, readonly rootElement:HTMLElement) {}
    public updateProps = (props:Props) => runtime.updateProps(this.$instance, props);
}

export function render<Props>(target: HTMLElement, factory: (props:Props) => TsxAirNode<Props>, props: Props) {
    const comp = runtime.render(target, factory.type, props);
    return comp && new ComponentApi(comp as ComponentInstance<any, Props, any>, target);
}

export { TSXAir } from './api/types'; 
export { lifecycle } from './api/lifecycle';