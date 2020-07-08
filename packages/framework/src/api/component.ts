import { Component } from '../runtime/types';
import { ValueOf } from '../runtime/types/type-utils';

export interface ComponentApi<Props> {
    updateProps: (props: Props) => void;
}
export class TsxComponentApi<Props> {
    constructor(readonly $instance: Component) { }
    public updateProps = (props: Props) => {
        this.$instance.stores.props.$set(props);
    };

    public setProp = (key: keyof Props, value: ValueOf<Props>) =>
        this.$instance.stores.props[key] = value;

    public getProp = (key: keyof Props) =>
         this.$instance.stores.props[key];
}