import { TSXAir, CompiledComponent, hydrate, ComponentInstance } from '../framework/runtime';



export const ParentComp = TSXAir<CompiledComponent<{ name: string }>>({
    unique: Symbol('ParentComp'),
    toString: props => `<div>
      hello <!-- start props.name -->${props.name}<!-- end props.name -->xxx
      ${ChildComp.toString({ name: props.name })}
    </div>`,
    hydrate: (element, instance) => ({
        text1: element.childNodes[2],
        ChildComp1: hydrate(ChildComp, element.childNodes[3] as HTMLElement, { name: instance.props.name })
    }),
    update: (props, _state: any, instance: ComponentInstance<{ name: string }>) => {
        if ('name' in props && props.name !== instance.props.name) {
            instance.context.text1.textContent = props.name;
            instance.context.ChildComp1.update({ 'name': props.name });
        }
    },
    unmount: (instance: ComponentInstance<{ name: string }>) => {
        instance.context.ChildComp1.unmount();
    }
});


export const ChildComp = TSXAir<CompiledComponent<{ name: string }>>({
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div>hello <!-- start text1 -->${props.name} <div>`,
    hydrate: (element: Element, _instance: ComponentInstance<{ name: string }>) => ({
        text1: element.childNodes[2],
    }),
    update: (props, _state: any, instance: ComponentInstance<{ name: string }>) => {
        if ('name' in props && props.name !== instance.props.name) {
            instance.context.text1.textContent = props.name;
        }
    },
    unmount: (_instance: ComponentInstance<{ name: string }>) => {
        //
    }
});


export const runExample = (element: HTMLElement) => {
    let name = 'gaga';
    element.innerHTML = ParentComp.toString({ name });
    const instance = hydrate(ParentComp, element.firstElementChild!, { name });



    const i = setInterval(() => {
        name += 'gaga';
        ParentComp.update({ name }, {}, instance);
    }, 50);
    return () => {
        clearInterval(i);
    };
};