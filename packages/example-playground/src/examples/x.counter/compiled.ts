import { CompiledComponent, render, InternalComponentInstance, performStateUpdate, performAll, emptyCompiled } from '../../framework/runtime/runtime2';
// tslint:disable: no-bitwise

// Inferred from the TSX all possible return values 
interface StatefulCompCtx extends Record<string, Element> { root: Element; }

interface StatefulCompProps { seconds: number; }
// All the component scope vars [possibly only those who are bound to the view]
interface StatefulCompState { counter: number; clickCounter: number; label: string; }


const StatefulComp: CompiledComponent<StatefulCompProps, StatefulCompState, StatefulCompCtx> = {
    ...emptyCompiled,
    propsMap: {
        seconds: 1 << 1,
    },
    stateMap: {
        counter: 1 << 2,
        clickCounter: 1 << 3,
        label: 1 << 4
    },
    calcOperations: 2,
    performCalc(props, state, changed, dependencies) {
        // console.log(`
        // changed: ${printChangeMap(changed, { props: this.propsMap, state: this.stateMap })}
        // dependencies: \n\t${dependencies.map(dep => printChangeMap(dep, { props: this.propsMap, state: this.stateMap })).join('\n\t')}


        // `);
        if (changed === performAll) {
            state.counter = 0;
            state.clickCounter = 0;
            state.label = '';
            changed = changed | this.stateMap.counter | this.stateMap.clickCounter | this.stateMap.label;
        }
        if (state.clickCounter! > 0) {
            if (changed & dependencies[0]) {
                state.label = `seconds : ${props.seconds} renders: ${++state.counter!} clicks: ${state.clickCounter!}\n` + state.label;
                dependencies[0] = this.stateMap.counter | this.stateMap.clickCounter | this.stateMap.label | this.propsMap.seconds;
                changed = changed | this.stateMap.label | this.stateMap.counter;
            }
        } else {
            if (changed & dependencies[1]) {
                state.label = `seconds : ${props.seconds}\n` + state.label;
                dependencies[1] = this.propsMap.seconds | this.stateMap.label;
                changed = changed | this.stateMap.label;
            }
        }
        return changed;
    },
    performRender(instance, changed) {
        if (changed & this.stateMap.label) {
            instance.dom.root.textContent = instance.state.label;
        }
    },
    performEffect(_instance) {
        //
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
    }
};


export const runExample = (element: HTMLElement) => {
    let current = 0;
    const comp = render(element, StatefulComp, { seconds: current })!;
    const i = setInterval(() => {
        current++;
        comp.update({ seconds: current });
    }, 10);
    return () => {
        clearInterval(i);
    };
};