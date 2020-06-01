import { isComponentType } from ".";
import { isFragmentType, DisplayableData, Displayable, isComponent, Component } from "./component";



export class Factory<Comp extends Displayable> {
    constructor(readonly type: any, readonly changesBitMap: Record<string, number>) {
    }
    // to be used after SSR
    hydrate(key: string, target: HTMLElement, data: DisplayableData): Comp {
        const instance = this.newInstance(key, data);
        instance.hydrate(target);
        return instance;
    }

    // creates an instance (with unattached DOM root in ctx.root)
    newInstance(key: string, data: DisplayableData): Comp {
        if (isFragmentType(this.type) && !isComponent(data)) {
            // @ts-ignore
            return new this.type(key, data) as Comp;
        }
        throw new Error(`Invalid fragment data: must be an instance of a Component`);
    }
}

export abstract class CompFactory<Comp extends Component> extends Factory<Comp> {
    initialState(_props: any): any { return {}; }
    newInstance(key: string, data: DisplayableData): Comp {
        if (isComponentType(this.type)) {
            // @ts-ignore
            return new this.type(key, data.props || {}, data.state || this.initialState(data.props) || {}, {}) as Comp;
        }
        throw new Error(`Invalid component`);
    }
}
