import { Dom } from '../../framework/types/component';
import { Factory } from '../../framework/types/factory';
import runtime from '../../framework/runtime';
import { render } from '../../framework';
import { Component } from '../../framework/types/component';

export const ParentComp = (() => {
    class ParentComp  {
      
        $$processUpdate(newProps, _, changeMap) {
            if (changeMap & ParentComp.changeBitmask.name) {
                this.context.text1.textContent = newProps.name;
                runtime.updateProps(this.context.childComp1, (p) => {
                    p.name = newProps.name;
                    return ParentComp.changeBitmask.name;
                });
            }
        }
    }

    ParentComp.changeBitmask = 

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

    return ParentComp;
})();


// tslint:disable-next-line: max-classes-per-file
class ChildComp extends Component<ChildCompCtx, ChildCompProps> {
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