import { CompiledComponent, hydrate, render, compToString } from '../../framework/runtime';

export const ParentComp: CompiledComponent<{ name: string }> = ({
    unique: Symbol('ParentComp'),
    toString: props => `<div>
      hello <!-- start props.name -->${props.name}<!-- end props.name -->xxx
      ${compToString(ChildComp,{ name: props.name })}
    </div>`,
    hydrate: (element, instance) => ({
        text1: element.childNodes[2],
        ChildComp1: hydrate(ChildComp, element.children[0], { name: instance.props.name })
    }),
    update: (props, _state, instance) => {
        if ('name' in props && props.name !== instance.props.name) {
            instance.context.text1.textContent = props.name;
            instance.context.ChildComp1.update({ 'name': props.name });
        }
    },
    unmount: instance => {
        instance.context.ChildComp1.unmount();
    }
});

export const ChildComp: CompiledComponent<{ name: string }> = ({
    unique: Symbol('ChildComp'),
    toString: props => `<div>hello <!-- start text1 -->${props.name} <div>`,
    hydrate: element => ({
        text1: element.childNodes[2],
    }),
    update: (props, _state, instance) => {
        if ('name' in props && props.name !== instance.props.name) {
            instance.context.text1.textContent = props.name;
        }
    },
    unmount: _instance => {
        //
    }
});

export const runExample = (element: HTMLElement) => {
    let name = 'gaga';
    const comp = render(element, ParentComp, { name });

    const i = setInterval(() => {
        name += 'gaga';
        comp.update({ name });
    }, 50);
    return () => {
        clearInterval(i);
    };
};