import { TSXAir, CompiledComponent, hydrate, update, TsxAirNode, tsxAirNode, elementToString, ComponentInstance } from '../framework/runtime';
const colors = ['red', 'blue', 'green'];

export const ParentComp: CompiledComponent<{ title: string }, {}> = TSXAir<CompiledComponent<{ title: string }, {}>>({
    unique: Symbol('ParentComp'),
    toString: (props, _state) => ContainerComp.toString({
        child: tsxAirNode(ParentComp.fragments!.div1, { title: props.title })
    }),
    hydrate: (element, instance) => {
        const res = {
            ContainerComp1: hydrate(ContainerComp, element, {
                child: tsxAirNode(ParentComp.fragments!.div1, { title: instance.props.title })
            })
        };

        return res;
    },
    update: (props, _state, instance) => {
        if ('title' in props && props.title !== instance.props.title) {
            instance.context.ContainerComp1.update({ child: tsxAirNode(ParentComp.fragments!.div1, { title: instance.props.title }) });
        }
    },
    unmount: _instance => {
        //
    },
    fragments: {
        div1: {
            unique: Symbol('ParentCompDiv1'),
            toString: (props: { title: string }) => `<div>${props.title}</div>`,
            hydrate(element) { return { element }; },
            update(props, _state, instance) {
                if ('title' in props && props.title !== instance.props.title) {
                    instance.context.element.textContent = props.title;
                }
            },
            unmount() {// 
            },
        }
    }
});
export const ContainerComp = TSXAir<CompiledComponent<{ child: TsxAirNode<any> }, { numColors: number }>>({
    unique: Symbol('ParentComp'),
    initialState: () => {
        return {
            numColors: 0
        };
    },
    toString: (props, state) => {
        const usedColors = colors.slice(0, state.numColors);
        return `<div>
    ${
            usedColors.map(color => elementToString(props.child, { style: { color } }))
        }
</div>`;
    },
    hydrate: (element, instance) => {
        const usedColors = colors.slice(0, instance.state.numColors);

        const res =  usedColors.reduce((r, color, idx)=>{
            r[color] = hydrate(instance.props.child.type, element.children[idx], {
                ...instance.props.child.props,
                ...{ style: { color } }
            });
            return r;
        }, {} as Record<string, ComponentInstance<any, any> | ChildNode>);
        
        element.onclick = () => {
            update(ParentComp, element, {}, { numColors: instance.state.numColors + 1 });
        };

        return res;
    },
    update: (props, _state, instance) => {
        if (props.child && instance.props.child !== props.child) {
            instance.context.child.forEach(() => {
//
            });
        }
    },
    unmount: _instance => {
        //
    },
    fragments: {
        div1: {
            unique: Symbol('ParentCompDiv1'),
            toString: () => `<div>hello</div>`,
            hydrate() { return {}; },
            update() {
                // 
            },
            unmount() {// 
            },
        }
    }
});

export const runExample = (element: HTMLElement) => {
    const props = { title: 'hello' };
    const state = ParentComp.initialState!(props);
    element.innerHTML = ParentComp.toString(props, state);
    hydrate(ParentComp, element.firstElementChild!, props);
};