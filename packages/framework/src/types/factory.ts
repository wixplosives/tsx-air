import { Displayable, DisplayableData } from "./displayable";
import { Component } from "./component";
import { Fragment } from "./fragment";

export class Factory<D extends typeof Displayable> {
    constructor(readonly type: D, readonly changesBitMap: Record<string, number>) {
        (type as any).changesBitMap = changesBitMap;
    }

    // creates an instance (with empty context)
    newInstance(key: string, parent: DisplayableData): InstanceType<D> {
        if (Fragment.isType(this.type)) {
            // @ts-ignore
            return new this.type(key, parent) as InstanceType<D>;
        }
        throw new Error(`Invalid fragment`);
    }
}

export class CompFactory<C extends typeof Component> extends Factory<C> {
    constructor(readonly type: C, readonly changesBitMap: Record<string, number>, readonly initialState = (_: any) => { }) {
        super(type, changesBitMap);
    }
    newInstance(key: string, data: DisplayableData): InstanceType<C> {
        if (Component.isType(this.type)) {
            // @ts-ignore
            const instance = new this.type(key,
                data.parent!,
                data.props || {},
                data.state ||
                this.initialState(data.props),
                {});
            // @ts-ignore
            instance.changesBitMap = this.changesBitMap;
            return instance as InstanceType<C>;
        }
        throw new Error(`Invalid component`);
    }
}
