import { CompiledComponent, initInstructions, render, InternalComponentInstance, performStateUpdate } from '../../framework/runtime/runtime2';
// tslint:disable: no-bitwise

// Inferred from the TSX all possible return values 
interface StatefulCompCtx extends Record<string, ChildNode> { root: Element; }

interface StatefulCompProps { seconds: number; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { counter: number; clickCounter: number; label: string; }


const StatefulComp: CompiledComponent<StatefulCompProps, StatefulCompState, StatefulCompCtx> = {
    propsMap: {
        seconds: 1 << 0,
    },
    stateMap: {
        counter: 1 << 1,
        clickCounter: 1 << 2,
        label: 1 << 3
    },
    createInstructions(type: CompiledComponent<StatefulCompProps, StatefulCompState, StatefulCompCtx>) {
        return {
            calcInstructions: [{
                dependencies: 0,
                execute: ctx => {
                    ctx.state.counter = 0;
                    return type.stateMap.counter;
                }
            }, {
                dependencies: 0,
                execute: ctx => {
                    ctx.state.clickCounter = 0;
                    return type.stateMap.clickCounter;
                }
            }, {
                dependencies: 0,
                execute: ctx => {
                    ctx.state.label = '';
                    return type.stateMap.label;
                }
            }, {
                dependencies: type.propsMap.seconds | type.stateMap.counter | type.stateMap.clickCounter | type.stateMap.label,
                execute: ctx => {
                    ctx.state.label = `seconds : ${ctx.props.seconds} renders: ${++ctx.state.counter} clicks: ${ctx.state.clickCounter}\n` + ctx.state.label;
                    return type.stateMap.label | type.stateMap.counter;
                }
            }],
            renderInstuctions: [
                {
                    dependencies: type.stateMap.label,
                    execute: ctx => {
                        ctx.dom.root.textContent = ctx.state.label;
                        return 0;
                    }
                }
            ]
        };
    },
    renderToString(_props: StatefulCompProps, state: StatefulCompState) {
        return `<pre>
            ${state.label}
        </pre>`;
    },
    hydrate(comp: InternalComponentInstance<StatefulCompProps, StatefulCompState, StatefulCompCtx>, element: Element) {
        const ctx = {
            root: element
        };
        ctx.root.addEventListener('click', () => {
            performStateUpdate(comp, {
                clickCounter: comp.state.clickCounter + 1
            });
        });
        return ctx;
    },
    instructions: {} as any
};
initInstructions(StatefulComp);


export const runExample = (element: HTMLElement) => {
    let current = 0;
    const comp = render(element, StatefulComp, { seconds: current })!;
    const i = setInterval(() => {
        current++;
        comp.update({ seconds: current });
    }, 1000);
    return () => {
        clearInterval(i);
    };
};