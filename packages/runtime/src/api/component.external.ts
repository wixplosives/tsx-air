import { Component } from '..';

type ValueOf<T> = T[keyof T];

export type RenderTarget = 'append' | 'before' | 'replace';

export interface ComponentApi<Props> {
    updateProps: (props: Props) => void;
    // TODO fix the value type
    setProp: (key: keyof Props, value: ValueOf<Props>) => void;
    getProp: (key: keyof Props) => ValueOf<Props>;
    dispose: () => void;
}
export class TsxComponentApi<Props> {
    constructor(readonly $instance: Component) { }
    public updateProps = (props: Props) => {
        this.$instance.stores.$props.$set(props);
    };

    public setProp = (key: keyof Props, value: ValueOf<Props>) =>
        this.$instance.stores.$props[key] = value;

    public getProp = (key: keyof Props) =>
        this.$instance.stores.$props[key];
}