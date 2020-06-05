import { Component } from "./component";
import { Fragment } from "./fragment";
import { Displayable, DisplayableData } from "./displayable";

export class VirtualElement<T extends typeof Displayable = any, P extends Displayable = Displayable> implements DisplayableData {
    private constructor(
        readonly type: T,
        readonly props: any,
        readonly state?: any,
        readonly volatile?: any,
        readonly parent?: P,
        readonly key?: string,
        readonly changeBitMapping?: Map<number, number>,
        public changes: number = 0
    ) { }

    static component<T extends typeof Component, P extends Displayable>(key: string, type: T, parent: P,
        changeBitMapping?: Map<number, number>,
        props: any = {}, state?: any, volatile?: any) {
        return new VirtualElement(type, props, state, volatile, parent, key, changeBitMapping);
    }

    static root<T extends typeof Component>(type: T, props: any, state?: any) {
        return new VirtualElement(type, props, state, undefined, undefined, '$');
    }

    static fragment<T extends typeof Fragment, P extends Displayable>(key: string, type: T, parent: P) {
        return new VirtualElement(type, parent.props, parent.state, parent.volatile, parent, key);
    }

    static is(x: any): x is VirtualElement {
        return x && x instanceof VirtualElement;
    }

    withKey(key: string) {
        const { type, parent, props, volatile, state, changes, changeBitMapping: changeBitRemapping } = this;
        return new VirtualElement(type, props, state, volatile, parent, key, changeBitRemapping, changes);
    };

    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }
}

