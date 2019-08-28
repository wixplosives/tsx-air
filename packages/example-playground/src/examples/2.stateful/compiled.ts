import { CompiledComponent, render, InternalComponentInstance, performStateUpdate, initInstructions } from '../../framework/runtime/runtime2';
// tslint:disable: no-bitwise

const formater = (str: string, format: string) => str + format;
// Inferred from the TSX all possible return values 
interface StatefulCompCtx extends Record<string, ChildNode> { div1: Element; div2: Element; span1: Element; span2: Element; }

interface StatefulCompProps { initialState: string; format: string; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { a: string; b: string; c: string; d: string; }


const StatefulComp: CompiledComponent<StatefulCompProps, StatefulCompState, StatefulCompCtx> = {
    propsMap: {
        initialState: 1 << 0,
        format: 1 << 1
    },
    stateMap: {
        a: 1 << 2,
        b: 1 << 3,
        c: 1 << 4,
        d: 1 << 5
    },
    createInstructions(type) {
        return {
            calcInstructions: [{
                dependencies: type.propsMap.initialState,
                execute: ctx => {
                    ctx.state.a = ctx.props.initialState;
                    return type.stateMap.a;
                }
            }, {
                dependencies: 0,
                execute: ctx => {
                    ctx.state.b = ctx.props.initialState;
                    return type.stateMap.b;
                }
            }, {
                dependencies: type.propsMap.initialState | type.propsMap.format,
                execute: ctx => {
                    ctx.state.c = formater(ctx.props.initialState, ctx.props.format);
                    return type.stateMap.c;
                }
            }, {
                dependencies: type.propsMap.initialState,
                execute: ctx => {
                    ctx.state.d = ctx.props.initialState;
                    return type.stateMap.d;
                }
            }],
            renderInstuctions: [
                {
                    dependencies: type.stateMap.a,
                    execute: ctx => {
                        ctx.dom.div1.textContent = ctx.state.a;
                        return 0;
                    }
                },
                {
                    dependencies: type.stateMap.b,
                    execute: ctx => {
                        ctx.dom.div2.textContent = ctx.state.b;
                        return 0;
                    }
                },
                {
                    dependencies: type.stateMap.c,
                    execute: ctx => {
                        ctx.dom.span1.textContent = ctx.state.c;
                        return 0;
                    }
                },
                {
                    dependencies: type.stateMap.d,
                    execute: ctx => {
                        ctx.dom.span2.textContent = ctx.state.d;
                        return 0;
                    }
                }
            ]
        };
    },
    renderToString(_props: StatefulCompProps, state: StatefulCompState) {
        return `<div>
            <div>
                ${state.a}
            </div>
            <div>
                ${state.b}
            </div>
            <span>${state.c}</span>
            <span>${state.d}</span>
        </div>`;
    },
    hydrate(comp: InternalComponentInstance<StatefulCompProps, StatefulCompState, StatefulCompCtx>, element: Element) {
        const ctx = {
            div1: element.children[0],
            div2: element.children[1],
            span1: element.children[2],
            span2: element.children[3],
        };
        ctx.div1.addEventListener('click', () => {
            performStateUpdate(comp, {
                a: comp.state.a + '!'
            });
        });
        ctx.div2.addEventListener('click', () => {
            performStateUpdate(comp, {
                b: comp.state.b + '*'
            });
        });
        return ctx;
    },
    instructions: {} as any
};
initInstructions(StatefulComp);


export const runExample = (element: HTMLElement) => {
    const values = ['click me', 'kill homer'];
    let current = 0;
    const api = render(element, StatefulComp, { initialState: values[0], format: 'gaga' });
    const i = setInterval(() => {
        if (Math.random() > 0.9) {
            current = current === 0 ? 1 : 0;
            api.update({ initialState: values[current], format: 'gaga' });
        }
    }, 50);
    return () => {
        clearInterval(i);
    };
};