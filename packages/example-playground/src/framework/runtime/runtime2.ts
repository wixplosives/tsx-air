
import { IntrinsicElements as IntrinsicElementsImported } from '../api/dom';

const nodeSymbol = Symbol('TsxAirNode');
export interface TsxAirNode<PROPS = any, T extends string | CompiledComponent<PROPS, any, any> = any> {
    [nodeSymbol]: true;
    type: T;
    props: PROPS;
    key: string | number;
}
export type AnyTsxAirNode = TsxAirNode<any, string | CompiledComponent<any, any, any>>;
export function isTsxAirNode(child: any): child is AnyTsxAirNode {
    return !!child && !!(child as any)[nodeSymbol];
}

export function createElement<PROPS>(type: CompiledComponent<PROPS, any, any>, props: PROPS, key: string | number): TsxAirNode<PROPS, CompiledComponent<PROPS, {}, {}>> {
    return {
        [nodeSymbol]: true,
        type,
        props,
        key
    };
}


export type TsxAirChild<Props = any> = null | string | number | TsxAirNode<Props, CompiledComponent<any, any, any>>;
export type TsxAirChildren = TsxAirChild<any> | Array<TsxAirChild<any> | Array<TsxAirChild<any>>>;
export type PartialHolders<T> = {
    [key in keyof T]?: {
        value: T[key]
    }
};

export const TSXAir = <Props, State = {}>(t: (props: Props & { children: TsxAirNode[] }, state: State) => TsxAirChild<Props>, _initialState?: State) =>
    t as any as CompiledComponentCreator<Props, State, any>;


export const TSXAir2 = <Props, State = {}>(t: (props: Props, state: PartialHolders<State>) => TsxAirChild<Props>) =>
    t as any as CompiledComponentCreator<Props, State, any>;

export const flattenChildren = (children: TsxAirChildren) => children as TsxAirNode[];
// tslint:disable-next-line: no-namespace
export namespace TSXAir {
    export namespace JSX {
        export type Element = TsxAirChild<any>;
        export interface IntrinsicAttributes {
            key?: string | number;
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

export function printChangeMap(current: number, maps: Record<string | number | symbol, Record<string, number>>) {
    const mapNames = Object.keys(maps);
    let changeMapStr = `printChangeMap for ${mapNames}\n`;
    for (const mapName of Object.keys(maps)) {
        const map = maps[mapName];
        changeMapStr += `**** ${mapName} ****\n`;
        for (const key of Object.keys(map)) {
            changeMapStr += `${key} : ${!!(current & map[key])}\n`;
        }
    }
    return changeMapStr;
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


export interface CompiledComponentCreator<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends IDOMContext> extends CompiledComponent<PROPS, STATE, DOMContext> {
    (props: PROPS): TsxAirNode<PROPS, this>;
}
export interface CompiledComponent<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends IDOMContext> {
    propsMap: Record<keyof PROPS, number>;
    stateMap: Record<keyof STATE, number>;
    renderToString: (props: PROPS, state: STATE) => string;
    hydrate: (instance: InternalComponentInstance<PROPS, STATE, DOMContext>, element: Element) => DOMContext;
    fragments?: Record<string, CompiledComponent<any, any, any>>;
    unmount?: (props: PROPS, state: STATE) => void;
    calcOperations: number;
    constants: Record<string, any>;
    createDependencies(props: PROPS, state: STATE): {
        renderDependenencies: number[];
        effectDependenencies: number[];
    };
    performCalc(props: PROPS, state: Partial<STATE>, changed: number, dependencies: number[]): number;
    performRender(instance: InternalComponentInstance<PROPS, STATE, DOMContext>, changed: number): void;
    performEffect(instance: InternalComponentInstance<PROPS, STATE, DOMContext>, changed: number): void;
}


export interface CompiledComponentInstance<PROPS extends Record<string, any>> {
    dom: HTMLElement;
    update(props: Partial<PROPS>): void;
    unmount(): void;
}

export interface IDOMContext {
    [key: string]: Element | CompiledComponentInstance<any> | IDOMRepeatContext;
}

export interface IDOMRepeatContext {
    [key: string]: CompiledComponentInstance<any>;
}

export interface InternalComponentInstance<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends IDOMContext> {
    state: STATE;
    props: PROPS;
    dom: DOMContext;
    type: CompiledComponent<PROPS, STATE, DOMContext>;
    depth: number;
    calcDependenencies: number[];
    renderDependenencies: number[];
    effectDependenencies: number[];
}
export const performAll = Number.MAX_SAFE_INTEGER;

export function renderToString<PROPS extends Record<string, any>>(comp: CompiledComponent<PROPS, any, any>, props: PROPS) {
    const state = {};
    comp.performCalc(props, state, performAll, []);
    return comp.renderToString(props, state);
}

export function childrenListToString(list: TsxAirChild[]) {
    return list.reduce((val, child) => {

        return val + childToString(child);
    }, '');
}

export function childToString(child: TsxAirChild) {
    if (child !== null) {
        if (isTsxAirNode(child)) {
            return renderToString(child.type, child.props);
        } else {
            return '' + (child as any);
        }
    }
    return '<!-- null -->';
}

function createInstance<PROPS extends Record<string, any>>(type: CompiledComponent<PROPS, any, any>, props: PROPS, depth: number): InternalComponentInstance<PROPS, any, any> {
    const instance: InternalComponentInstance<PROPS, any, any> = {
        state: {},
        props,
        dom: {},
        type,
        depth,
        calcDependenencies: Array.from({
            length: type.calcOperations,
        }, () => performAll),
        renderDependenencies: [],
        effectDependenencies: []
    };
    type.performCalc(props, instance.state, performAll, instance.calcDependenencies);
    return instance;
}

function createLiveInstance<PROPS extends Record<string, any>>(element: HTMLElement, type: CompiledComponent<PROPS, any, any>, instance: InternalComponentInstance<PROPS, any, any>): CompiledComponentInstance<PROPS> {
    const dom = type.hydrate(instance, element);
    instance.dom = dom;
    const deps = type.createDependencies(instance.props, instance.state);
    instance.effectDependenencies = deps.effectDependenencies;
    instance.renderDependenencies = deps.renderDependenencies;

    type.performEffect(instance, performAll);
    return {
        update(newProps) {
            pendUpdate(instance, newProps, {});
        },
        dom: element,
        unmount() {
            if (type.unmount) {
                type.unmount(instance.props, instance.state);
            }
        }
    };
}

export function hydrate<PROPS extends Record<string, any>>(element: HTMLElement, type: CompiledComponent<PROPS, any, any>, props: PROPS, depth: number): CompiledComponentInstance<PROPS> {
    const instance = createInstance(type, props, depth);

    return createLiveInstance(element, type, instance);
}
export function render<PROPS extends Record<string, any>>(element: HTMLElement, type: CompiledComponent<PROPS, any, any>, props: PROPS): CompiledComponentInstance<PROPS> {
    const instance = createInstance(type, props, 0);

    element.innerHTML = type.renderToString(props, instance.state);
    return createLiveInstance(element.children[0] as HTMLElement, type, instance);
}

let factoryElement: HTMLElement;
export function createDetachedComp<PROPS extends Record<string, any>>(type: CompiledComponent<PROPS, any, any>, props: PROPS): CompiledComponentInstance<PROPS> {
    factoryElement = factoryElement || document.createElement('div');

    return render(factoryElement, type, props);
}

export class OrderedInstanceMap {
    private map: Map<InternalComponentInstance<any, any, any>, { props: any, state: any }> = new Map();
    private que: Array<{
        instance: InternalComponentInstance<any, any, any>,
        value: { props: any, state: any }
    }> = [];
    public get(key: InternalComponentInstance<any, any, any>) {
        return this.map.get(key);
    }
    public has(key: InternalComponentInstance<any, any, any>) {
        return this.map.has(key);
    }
    public set(key: InternalComponentInstance<any, any, any>, value: { props: any, state: any }) {
        const idx = this.que.findIndex(({ instance }) => instance.depth >= key.depth);
        if (idx === -1) {
            this.que.push({
                instance: key,
                value
            });
        }
        this.map.set(key, value);
    }
    public sorted(): Array<{
        instance: InternalComponentInstance<any, any, any>,
        value: { props: any, state: any }
    }> {
        return this.que;
    }
}
let pendingUpdates = new OrderedInstanceMap();
let pending: number = 0;
export function pendUpdate<PROPS, STATE>(instance: InternalComponentInstance<PROPS, STATE, any>, props: Partial<PROPS>, state: Partial<STATE>) {

    if (pending === 0) {
        pending = requestAnimationFrame(nextTick);
    }
    const prevUpdate = pendingUpdates.get(instance);
    if (prevUpdate) {
        prevUpdate.state = { ...prevUpdate.state, ...state };
        prevUpdate.props = { ...prevUpdate.props, ...props };
    } else {
        pendingUpdates.set(instance, { props, state });
    }
}
const dev = false;
export function nextTick() {
    if (dev) {
        console.time('tick');
    }
    const sorted = pendingUpdates.sorted();
    while (sorted.length) {
        const { instance, value } = sorted.shift()!;
        const { props, state, type } = instance;
        const changed = createPartialChangeMap(type.stateMap, value.state, state) | createPartialChangeMap(type.propsMap, value.props, props);
        const merged = { ...state, ...value.state };
        const newProps = { ...props, ...value.props };
        instance.state = merged;
        instance.props = newProps;
        const newChanged = type.performCalc(newProps, merged, changed, instance.calcDependenencies);
        type.performRender(instance, newChanged);
        type.performEffect(instance, newChanged);
    }
    pendingUpdates = new OrderedInstanceMap();
    pending = 0;
    if (dev) {
        console.timeEnd('tick');
    }
}

export function performStateUpdate<PROPS extends Record<string, any>, STATE extends Record<string, any>, DOMContext extends IDOMContext>(
    comp: InternalComponentInstance<PROPS, STATE, DOMContext>,
    changedState: Partial<STATE>
) {
    pendUpdate(comp, {}, changedState);
}

export const lifecycle = {
    memo<T>(calc: () => T, _dependencies: any[] = []) {
        return calc();
    },
    state<T>(state: T): [T, (newState: T) => void] {
        return [state, (_newState: T) => undefined];
    },
    effect(_exec: () => void, _dependencies: any[] = []) {
        //
    },
};

export const holder: <T>(t: T) => { value: T } = t => ({ value: t });
export const getState: <T>(t: T) => T = t => t;


export const emptyCompiled: CompiledComponent<{}, {}, {}> = {
    propsMap: {},
    stateMap: {},
    calcOperations: 0,
    createDependencies() {
        return {
            effectDependenencies: [],
            renderDependenencies: []
        };
    },

    renderToString: () => '',
    hydrate: element => ({ root: element }),
    performCalc() {
        return 0;
    },
    performEffect() {
        //
    },
    performRender() {
        //
    },
    constants: {}
};

export function hydrateChildList(parentElement: Element, list: TsxAirNode[], depth: number) {
    const context: IDOMRepeatContext = {};
    for (let i = 0; i < list.length; i++) {
        const tsxNode = list[i];
        const element = parentElement.children[i] as HTMLElement;
        if (!element) {
            throw new Error('node not found using update');
        }
        context[tsxNode.key!] = hydrate(element, tsxNode.type, tsxNode.props, depth);
    }
    return context;
}


export function updateChildList(parentElement: Element, list: TsxAirNode[], context: IDOMRepeatContext) {
    const currentKeys: Set<string> = new Set();
    for (let i = 0; i < list.length; i++) {
        const tsxNode = list[i];
        const key = tsxNode.key as string;
        currentKeys.add(key);
        if (!context[key]) {
            // new instance
            context[key] = createDetachedComp(tsxNode.type, tsxNode.props);
        } else {
            context[key].update(tsxNode.props);
        }
        const element = parentElement.children[i] as HTMLElement;
        const comp = context[key];
        if (comp.dom !== element) {
            // instance was somewhere else
            if (!element) {
                parentElement.appendChild(comp.dom);
            } else {
                parentElement.insertBefore(comp.dom, element);
            }
        }

    }
    const endKeys = Object.keys(context);
    for (const key of endKeys) {
        if (!currentKeys.has(key)) {
            context[key].unmount();
            if (context[key].dom.parentElement === parentElement) {
                parentElement.removeChild(context[key].dom);
            }
            delete context[key];
        }
    }
}

export const styleToString = (style: Record<string, string>) => {
    if (!style) {
        return '';
    }
    return Object.entries(style).map(([key, val]) => key + ':' + val).join(';');
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