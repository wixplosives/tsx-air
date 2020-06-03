import { DisplayableData, Displayable, Component, Fragment } from "./component";

export class VirtualElement<T extends typeof Displayable, O extends Component=Component> implements DisplayableData {
    private constructor(
        readonly type: T,
        readonly props: any,
        readonly state?: any,
        readonly volatile?: any,
        readonly owner?: O,
        readonly key?: string,
        readonly changeBitMapping?: Map<number, number>,
        public changes: number = 0
    ) { }

    static component<T extends typeof Component, O extends Component>(key: string, type: T, owner: O,
        changeBitMapping?: Map<number, number>,
        props: any = {}, state?: any, volatile?: any) {
        return new VirtualElement(type, props, state, volatile, owner, key, changeBitMapping);
    }

    static root<T extends typeof Component>(type: T, props: any, state?: any) {
        return new VirtualElement(type, props, state, undefined, undefined, 'ROOT');
    }

    static fragment<T extends typeof Fragment, O extends Component>(key: string, type: T, owner: O) {
        return new VirtualElement(type, owner.props, owner.state, owner.volatile, owner, key);
    }

    withKey(key: string) {
        const { type, owner, props, volatile, state, changes, changeBitMapping: changeBitRemapping } = this;
        return new VirtualElement(type, props, volatile, state, owner, key, changeBitRemapping, changes);
    };
}

export function isVirtualElement(x: any): x is VirtualElement<any> {
    return x instanceof VirtualElement;
}

