
import { IntrinsicElements as IntrinsicElementsImported } from '../api/dom';

export interface TsxAirNode<PROPS, T extends string | CompiledComponent<PROPS, any, any>> {
    type: T;
    props: PROPS;
    key?: string | number | null;
}

export type TsxAirChild<Props> = null | string | number | TsxAirNode<Props, CompiledComponent<any, any, any>>;


export const TSXAir = <Props>(t: (props: Props) => TsxAirChild<Props>) =>
    t as any as CompiledComponent<Props, any, any>;

// tslint:disable-next-line: no-namespace
export namespace TSXAir {
    export namespace JSX {
        export type Element = TsxAirChild<any>;
        export interface IntrinsicAttributes {
            key?: string;
        }
        export interface ElementChildrenAttribute { children: {}; }
        export type IntrinsicElements = IntrinsicElementsImported;
    }
}

export interface RefHolder<T extends HTMLElement> {
    element?: T;
}
export interface Instruction<CONTEXT extends object> {
    dependencies: number;
    execute: (context: CONTEXT) => number;
}




export type InstructionList<CONTEXT extends object> = Array<Instruction<CONTEXT>>;


export function performInstructions<CONTEXT extends object>(instructions: InstructionList<CONTEXT>, context: CONTEXT, changeMap: number): number {
    for (const current of instructions) {
        // tslint:disable: no-bitwise
        if (current.dependencies & changeMap) {
            changeMap = changeMap | current.execute(context);
        }
    }
    return changeMap;
}

export function performAllInstructions<CONTEXT extends object>(instructions: InstructionList<CONTEXT>, context: CONTEXT) {
    for (const current of instructions) {
        current.execute(context);
    }
}

export function createChangeMap<CONTEXT extends object>(map: Record<string, number>, current: CONTEXT) {
    let changeMap = 0;
    for (const key of Object.keys(current)) {
        changeMap = changeMap | map[key];
    }
    return changeMap;
}
export function createPartialChangeMap<CONTEXT extends Record<string, any>>(map: Record<string, number>, next: Partial<CONTEXT>, current: CONTEXT) {
    let changeMap = 0;
    for (const key of Object.keys(next)) {
        if (next[key] !== current[key]) {

            changeMap = changeMap | map[key];
        }
    }
    return changeMap;
}

export interface CompiledComponent<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends Record<string, ChildNode>> {
    propsMap: Record<keyof PROPS, number>;
    stateMap: Record<keyof STATE, number>;
    renderToString: (props: PROPS, state: STATE) => string;
    hydrate: (instance: InternalComponentInstance<PROPS, STATE, DOMContext>, element: Element) => DOMContext;
    instructions: {
        calcInstructions: InstructionList<{ props: PROPS, state: STATE }>;
        renderInstuctions: InstructionList<{ props: PROPS, state: STATE, dom: DOMContext }>;
    };
    createInstructions(type: CompiledComponent<PROPS, STATE, DOMContext>): {
        calcInstructions: InstructionList<{ props: PROPS, state: STATE }>;
        renderInstuctions: InstructionList<{ props: PROPS, state: STATE, dom: DOMContext }>;
    };
}


export interface CompiledComponentInstance<PROPS extends Record<string, any>> {
    update(props: Partial<PROPS>): void;
}


export interface InternalComponentInstance<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends Record<string, ChildNode>> {
    state: STATE;
    props: PROPS;
    dom: DOMContext;
    type: CompiledComponent<PROPS, STATE, DOMContext>;
}

export function initInstructions(comp: CompiledComponent<any, any, any>) {
    comp.instructions = comp.createInstructions(comp);
}

export function renderToString<PROPS extends Record<string, any>>(comp: CompiledComponent<PROPS, any, any>, props: PROPS) {
    const state = {};
    const instructions = comp.createInstructions(comp);
    performAllInstructions(instructions.calcInstructions, {
        props,
        state
    });
    return comp.renderToString(props, state);
}



export function render<PROPS extends Record<string, any>>(element: HTMLElement, type: CompiledComponent<PROPS, any, any>, props: PROPS): CompiledComponentInstance<PROPS> {
    const instance = {
        state: {},
        props,
        dom: {},
        type
    };
    const instructions = type.createInstructions(type);
    performAllInstructions(instructions.calcInstructions, {
        props,
        state: instance.state
    });
    element.innerHTML = type.renderToString(props, instance.state);
    const dom = type.hydrate(instance, element.children[0]);
    instance.dom = dom;
    return {
        update(newProps) {
            const changed = createPartialChangeMap(type.propsMap, instance.props, newProps);
            instance.props = { ...instance.props, ...newProps };
            const changedWithState = performInstructions(instructions.calcInstructions, {
                props: instance.props,
                state: instance.state
            },
                changed);
            performInstructions(instructions.renderInstuctions, {
                props: instance.props,
                state: instance.state,
                dom
            },
                changedWithState);
        }
    };
}

export function performStateUpdate<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends Record<string, ChildNode>>(
    comp: InternalComponentInstance<PROPS, STATE, DOMContext>,
    changedState: Partial<STATE>) {
    const { props, state, type, dom } = comp;
    const changed = createPartialChangeMap(type.stateMap, state, changedState);
    const newState = { ...state, ...changedState };
    const changedWithState = performInstructions(type.instructions.calcInstructions, {
        props,
        state: newState
    },
        changed);
    performInstructions(type.instructions.renderInstuctions, {
        props,
        state: newState,
        dom
    },
        changedWithState);
    comp.state = newState;
}

export const lifecycle = {
    memo<T>(calc: () => T, _dependencies: any[] = []) {
        return calc();
    },
    state<T>(state: T): [T, (newState: T)=>void] {
        return [state, (_newState: T) => undefined];
    }
};

// const example = {
//     map:{
//         a: 1<<0,
//         b: 1<<1
//     },
//     calc( props: {a: string,b : string }){
//         const changed = createChangeMap(this.map, props)
//         performInstructions<typeof example['map']>([], this.map, changed);
//     }
// }