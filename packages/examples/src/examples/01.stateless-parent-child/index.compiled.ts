import { CompCreator } from "@tsx-air/framework/src/api/types";
import { RenderTarget, ComponentApi } from "@tsx-air/framework/src";

interface Props {
    name: string
}
export const ChildComp: CompCreator<Props> = (props: Props) => ({
    props
});
ChildComp.render = (props: Props, _?: object, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw 'Now supported in this example';
    }
    const child = document.createElement('div');
    child.textContent = `Child: ${props.name}`;
    child.classList.add('child');
    target.append(child);
    return {
        updateProps: (props: Props) => {
            child.textContent = `Child: ${props.name}`
        },
    } as ComponentApi<Props>;
}

export const ParentComp: CompCreator<Props> = (props: Props) => ({
    props
});
ParentComp.render = (props: Props, _?: object, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw 'Now supported in this example';
    }
    const parent = document.createElement('div');
    parent.textContent = `Parent: ${props.name}`;
    parent.classList.add('parent');
    const child = ChildComp.render(props, undefined, parent as HTMLElement, 'append');
    target.append(parent);
    return {
        updateProps: (props: Props) => {
            parent.childNodes[0].textContent = `Parent: ${props.name}`;
            child.updateProps(props);
        },
    } as ComponentApi<Props>;
}