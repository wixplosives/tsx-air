import { Component } from './component';
import { Fragment } from './fragment';
import { Displayable, DisplayableData } from './displayable';
import { remapChangedBit } from '../runtime/runtime.helpers';

export class VirtualElement<T extends typeof Displayable = any, P extends Displayable = Displayable> implements DisplayableData {
    get fullKey(): string {
        return this.parent ? `${this.parent.fullKey}${this.key}` : this.key || 'NO KEY';
    }

    get owner(): Component | undefined {
        return Component.is(this.parent) ? this.parent : this.parent?.owner;
    }

    static component<T extends typeof Component, P extends Displayable>(key: string, type: T, parent: P,
        changeBitMapping?: Map<number, number>,
        props: any = {}) {
        return new VirtualElement(type as any, props, parent, key, changeBitMapping);
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
        readonly changeBitMapping?: Map<number, number>,
        public changes: number = 0
    ) { }

    withKey(key: string) {
        const { type, parent, props, changes, changeBitMapping: changeBitRemapping } = this;
        return new VirtualElement(type, props, parent, key, changeBitRemapping, changes);
    }

    withChanges(changes: number) {
        const { type, parent, props, key, changeBitMapping: changeBitRemapping } = this;
        return new VirtualElement(type, props, parent, key, changeBitRemapping, remapChangedBit(changes, changeBitRemapping));
    }
    
    toString() {
        return `[VirtualElement<${this.type.name}> (key:"${this.key}", parent:${this.parent?.fullKey})]`;
    }
}

