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

    public static component<T extends typeof Component, P extends Displayable>(key: string, type: T, parent: P,
        changeBitMapping?: Map<number, number>,
        props: any = {}, state?: any, volatile?: any) {
        return new VirtualElement(type, props, state, volatile, parent, key, changeBitMapping);
    }

    public static root<T extends typeof Component>(type: T, props: any, state?: any) {
        return new VirtualElement(type, props, state, undefined, undefined, '$');
    }

    public static fragment<T extends typeof Fragment, P extends Displayable>(key: string, type: T, parent: P) {
        return new VirtualElement(type, parent.props, parent.state, parent.volatile, parent, key);
    }

    public static is(x: any): x is VirtualElement {
        return x && x instanceof VirtualElement;
    }
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

    public withKey(key: string) {
        const { type, parent, props, volatile, state, changes, changeBitMapping: changeBitRemapping } = this;
        return new VirtualElement(type, props, state, volatile, parent, key, changeBitRemapping, changes);
    }    
    public withChanges(changes:number) {
        const { type, parent, props, volatile, state, key, changeBitMapping: changeBitRemapping } = this;
        return new VirtualElement(type, props, state, volatile, parent, key, changeBitRemapping, remapChangedBit(changes, changeBitRemapping));
    }
    public toString(){
        return `[VirtualElement<${this.type.name}> (key:"${this.key}", parent:${this.parent?.fullKey})]`;
    }
}

