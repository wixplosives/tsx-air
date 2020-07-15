import { Component, DisplayableData, Displayable, Fragment } from '@tsx-air/runtime';

export class VirtualElement implements DisplayableData {
    get fullKey(): string {
        return this.parent ? `${this.parent.fullKey}${this.key}` : this.key || 'NO KEY';
    }

    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }

    static component(key: string, type: typeof Component, parent: Displayable,
        props: any = {}) {
        return new VirtualElement(type, props, parent, key);
    }

    static root<T extends typeof Component>(type: T, props: any) {
        return new VirtualElement(type as any, props, undefined, '$');
    }

    static fragment<T extends typeof Fragment, P extends Displayable>(key: string, type: T, parent: P) {
        return new VirtualElement(type as any, parent.stores.props, parent, key);
    }

    static is(x: any): x is VirtualElement {
        return x && x instanceof VirtualElement;
    }

    private constructor(
        readonly type: any,
        readonly props: any,
        readonly parent?: Displayable,
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

