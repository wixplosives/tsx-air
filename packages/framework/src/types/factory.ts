import { Displayable, DisplayableData } from "./displayable";
import { Component } from "./component";
import { Fragment } from "./fragment";
import { TSXAir, VirtualElement, TsxComponentApi } from "..";

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

export type RenderTarget = 'append' | 'before' | 'replace';

export class CompFactory<C extends typeof Component> extends Factory<C> {
    constructor(readonly type: C, readonly changesBitMap: Record<string, number>, readonly initialState = (_: any) => { }) {
        super(type, changesBitMap);
        type.render = (props: object, state?: object, target?: HTMLElement, add: RenderTarget = 'append') =>
            this.render(type, props, state, target, add);
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

    render(component: C, props: any, state: any, target?: HTMLElement, add?: RenderTarget) {
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
        return new TsxComponentApi(comp as Component);
    }
}
