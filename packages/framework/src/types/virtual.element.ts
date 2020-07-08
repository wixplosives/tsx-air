import { Component } from './component';
import { Fragment } from './fragment';
import { Displayable, DisplayableData } from './displayable';

export class VirtualElement<T extends typeof Displayable = any, P extends Displayable = Displayable> implements DisplayableData {
    get fullKey(): string {
        return this.parent ? `${this.parent.fullKey}${this.key}` : this.key || 'NO KEY';
    }

    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }

    static component<T extends typeof Component, P extends Displayable>(key: string, type: T, parent: P,
        props: any = {}) {
        return new VirtualElement(type as any, props, parent, key);
    }

    static root<T extends typeof Component>(type: T, props: any) {
        return new VirtualElement(type as any, props, undefined, '$');
    }

    static fragment<T extends typeof Fragment, P extends Displayable>(key: string, type: T, parent: P) {
        return new VirtualElement(type, parent.stores.props, parent, key);
    }

    static is(x: any): x is VirtualElement {
        return x && x instanceof VirtualElement;
    }

    private constructor(
        readonly type: T,
        readonly props: any,
        readonly parent?: P,
        readonly key?: string,
    ) { }

    withKey(key: string) {
        const { type, parent, props } = this;
        return new VirtualElement(type, props, parent, key);
    }

    toString() {
        return `[VirtualElement<${this.type.name}> (key:"${this.key}", parent:${this.parent?.fullKey})]`;
    }
}

