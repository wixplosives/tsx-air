import { Factory } from '../../framework/types/factory';
import runtime from '../../framework/runtime';
import {render } from '../../framework';
import { Component, Dom } from '../../framework/types/component';

interface ParentCompProps { name: string; }
interface ParentCompCtx extends Dom {
    text1: ChildNode;
    childComp1: ChildComp;
}

export class ParentComp extends Component<ParentCompCtx, ParentCompProps> {
    public static factory: Factory<ParentComp>;
    public static readonly changeBitmask = {
        name: 1 << 0
    };

    public $$processUpdate(newProps: ParentCompProps, _: {}, changeMap: number): void {
        if (changeMap & ParentComp.changeBitmask.name) {
            this.context.text1.textContent = newProps.name;
            runtime.updateProps(this.context.childComp1 as ChildComp, (p: ParentCompProps) => {
                p.name = newProps.name;
                return ChildComp.changeBitmask.name;
            });
        }
    }
}

ParentComp.factory = {
    unique: Symbol('ParentComp'),
    toString: props => `<div class="parent">
      Hello <!-- start props.name -->${props.name}<!-- end props.name --> from parent
      ${ChildComp.factory.toString(props)}
    </div>`,
    hydrate: (root, props) => new ParentComp(
        {
            root,
            text1: root.childNodes[2],
            childComp1: ChildComp.factory.hydrate(root.children[0] as HTMLElement, props)
        }, props, {}),
    initialState: (_: any) => ({})
};

interface ChildCompProps { name: string; }
interface ChildCompCtx extends Dom { text1: Text; }

// tslint:disable-next-line: max-classes-per-file
export class ChildComp extends Component<ChildCompCtx, ChildCompProps> {
    public static factory: Factory<ChildComp>;
    public static readonly changeBitmask = {
        name: 1 << 0
    };

    public $$processUpdate(newProps: ChildCompProps, _: {}, changeMap: number): void {
        if (changeMap & ChildComp.changeBitmask.name) {
            this.context.text1.textContent = newProps.name;
        }
    }
}

ChildComp.factory = {
    unique: Symbol('ChildComp'),
    toString: (props: { name: string }) => `<div class="child">Greetings <!-- start props.name -->${props.name}<!-- end props.name --> from child</div>`,
    hydrate: (root, props) => new ChildComp({
        root,
        text1: root.childNodes[2] as Text,
    }, props, {}),
    initialState: (_: any) => ({})
};

export const runExample = (element: HTMLElement) => {
    const countTo = 100;
    let count = 0;
    let frames = 0;
    const startTime = performance.now();
    const app = render(element, ParentComp as any, { name: `Initial count: ${count}` });
    const isViewUpdated = () => {
        const countDisplayed = element.innerText.match(new RegExp(`${count}`, 'g'));
        return (countDisplayed && countDisplayed.length === 2);
    };
    const summery = () => {
        const duration = Math.round(performance.now() - startTime);
        return `It took ${frames} frames (${duration}mSec) to update the view ${countTo} times.
                That's ${(frames / countTo).toFixed(2)} frames/update at ${(frames / duration * 1000).toFixed(2)} FPS`;
    };

    const framesCounter = () => {
        frames++;
        if (isViewUpdated()) {
            app.updateProps({ name: `Updated ${++count} times` });
        }
        if (count <= countTo) {
            requestAnimationFrame(framesCounter);
        } else {
            app.updateProps({ name: summery() });
        }
    };

    framesCounter();
};
