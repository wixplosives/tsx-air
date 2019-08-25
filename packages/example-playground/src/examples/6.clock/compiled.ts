import { Factory } from '../../framework/types/factory';
import { StatefulComponent } from '../../framework/types/component';
import runtime from '../../framework/runtime';
import { Diff } from '../../framework/runtime/utils';

interface DigitContext { root: HTMLElement; a: HTMLDivElement; b: HTMLDivElement; }
interface DigitProps { value: string; updateTime?: number; }
interface DigitState {
    current?: HTMLDivElement;
    next?: HTMLDivElement;
    isInProgress: boolean;
    nextValue: string;
    shouldChange: boolean;
    stillAnimating: Set<HTMLElement>;
}

export class Digit extends StatefulComponent<DigitContext, DigitProps, DigitState>{
    public $updateState(_diff: Diff<DigitState>, delta: Partial<DigitState>): void {
        const nextState = { ...this.state, ...delta };
        if (delta.isInProgress === true) {
            if (nextState.current) {
                nextState.current.classList.add('exit');
            }
            nextState.next!.innerHTML = nextState.nextValue.charAt(0);
            nextState.next!.classList.remove('waiting');
        }
    }

    public $updateProps(_diff: any, newProps: DigitProps): void {
        runtime.updateState(this, { nextValue: newProps.value, shouldChange: true });
        this.startChange();
    }

    public $afterMount(_ref: any) {
        this.context.a.addEventListener('animationend', this.swapRoles);
        this.context.a.addEventListener('transitionend', this.swapRoles);
        this.context.b.addEventListener('transitionend', this.swapRoles);
        this.startChange();
    }


    private swapRoles = (e:AnimationEvent|TransitionEvent) => {
        const {state} = this;
        const { a, b } = this.context;
        state.stillAnimating.delete(e.target as HTMLElement);
        if (state.stillAnimating.size > 0) {
            return;
        }

        const [next, current] = [state.next || a, state.current || b];
        const classes = current.classList;
        classes.add('no-transition');
        next.classList.add('no-transition');

        requestAnimationFrame(() => {
            classes.add('waiting');
            classes.remove('exit');
            requestAnimationFrame(()=>{
                classes.remove('no-transition');
                next.classList.remove('no-transition');
                state.stillAnimating.add(a);
                state.stillAnimating.add(b);
            });


            runtime.updateState(this, {
                next: current,
                current: next,
                isInProgress: false
            });
        });
    };

    private startChange() {
        if (!this.state.isInProgress) {
            runtime.updateState(this, {
                isInProgress: true,
                shouldChange: false,
                next: this.state.next || this.context.a
            });
        }
    }
}

const initialState = (props: DigitProps): DigitState => ({
    nextValue: props.value,
    isInProgress: false,
    shouldChange: true,
    stillAnimating: new Set<HTMLElement>()
});

export const DigitFactory: Factory<Digit> = {
    unique: Symbol('DigitFactory'),
    toString: (props: DigitProps, state?: DigitState) => {
        state = state || initialState(props);
        return `<div class="digit">
            <div class="enter">${props.value}</div>
            <div class="waiting"></div>
        </div>`;
    },
    hydrate: (root: HTMLElement, props: DigitProps, state?: DigitState) =>
        new Digit({
            root,
            a: root.children[0] as HTMLDivElement,
            b: root.children[1] as HTMLDivElement
        }, props, state || initialState(props)),
    initialState
};



export const runExample = (target: HTMLElement) => {
    let val = 0;
    const comp = runtime.render(target, DigitFactory, { value: '' })!;
    const intId = setInterval(() => {
        runtime.updateProps(comp, { value: '' + val, updateTime: Date.now() });
        val++;
        val %= 10;
    }, 200);
    return () => clearInterval(intId);
};
