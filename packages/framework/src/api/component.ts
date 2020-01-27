import runtime from '../runtime';
import { Component, Dom } from '../types';
import { setProp } from '../runtime/utils';
import { ValueOf } from '../types/type-utils';
import { CompCreator } from './types';

export class ComponentApi<Props> {
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

export function render<Props>(target: HTMLElement, component: CompCreator<Props>, props: Props) {
    const comp = runtime.render(target, component.factory, props) as Component<Dom, Props, {}>;
    return comp && new ComponentApi(comp, target);
}