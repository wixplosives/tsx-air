import runtime from './runtime';
import { ValueOf } from './types/type-utils';
import { CompCreator as ComponentDef } from './api/types';
import { Component, Dom } from './types/component';
import * as delegate from './api/delegate';
import { setProp } from './runtime/utils';

export { TSXAir, RefHolder } from './api/types';
export { delegate };
export { bind } from './api/bind';
export { store } from './api/store';
export { when, always, requestRender } from './api/lifecycle';
export * from './types';
export { default as runtime } from './runtime';
export { utils as runtimeUtils } from './runtime';

class ComponentApi<Props> {
    constructor(readonly $instance: Component<Dom, Props, any>, readonly rootElement: HTMLElement) { }
    public updateProps = (props: Props) => runtime.updateProps(
        this.$instance as unknown as Component, p => {
            let changed = 0;
            for (const [key, value] of Object.entries(props)) {
                changed |= setProp(this.$instance, p as Props, value, key as any);
            }
            for (const [key, value] of Object.entries(p)) {
                // @ts-ignore
                if (value !== props[key]) {
                    // @ts-ignore
                    changed |= this.$instance.constructor.changeBitmask[key];
                    // @ts-ignore
                    delete p[key];
                }
            }
            return changed;
        });

    public setProp = (key: keyof Props, value: ValueOf<Props>) =>
        runtime.updateProps(this.$instance, props => {
            return setProp(this.$instance, props as Props, value, key);
        });

    public getProp = (key: keyof Props) =>
        // @ts-ignore
        this.$instance.props[key];
}

export function render<Props>(target: HTMLElement, component: ComponentDef<Props>, props: Props) {
    const comp = runtime.render(target, component.factory, props) as Component<Dom, Props, {}>;
    return comp && new ComponentApi(comp, target);
}
