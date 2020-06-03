import { isComponentType } from ".";
import { isFragmentType, DisplayableData, Displayable, isComponent, Component, isVirtualElement } from "./component";

export class Factory<Comp extends Displayable> {
    constructor(readonly type: any, readonly changesBitMap: Record<string, number>) {
        type.changesBitMap = changesBitMap;
    }
    // to be used after SSR
    hydrate(key: string, target: HTMLElement, data: DisplayableData): Comp {
        const instance = this.newInstance(key, data);
        instance.hydrate(target, data);
        return instance;
    }

    // creates an instance (with no context)
    newInstance(key: string, data: DisplayableData): Comp {
        if (isFragmentType(this.type)
            && (isComponent(data) || isComponent(data.owner))
        ) {
            // @ts-ignore
            const instance = new this.type(key, data.owner || data) as Comp;
            return instance;
        }
        throw new Error(`Invalid fragment data: must be an instance of a Component`);
    }
}

export class CompFactory<Comp extends Component> extends Factory<Comp> {
    constructor(readonly type: any, readonly changesBitMap: Record<string, number>, readonly initialState = (_:any)=>{}) {
        super(type, changesBitMap);
    }
    newInstance(key: string, data: DisplayableData): Comp {
        if (isComponentType(this.type)) {
            // @ts-ignore
            const instance = new this.type(key, data.props || {}, data.state || this.initialState(data.props) || {}, {}) as Comp;
            // @ts-ignore
            instance.changesBitMap = this.changesBitMap;
            return instance;
        }
        throw new Error(`Invalid component`);
    }
}
