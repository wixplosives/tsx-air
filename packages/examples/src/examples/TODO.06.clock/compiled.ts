import { Factory, runtime, runtimeUtils, Component } from '@tsx-air/framework';
// imported to keep the example code compact 
import { AnimatedDiv } from './source';

const  { spreadToElementString, noop, updateSpreadElement, handleChanges } = runtimeUtils;

interface DigitContext { root: HTMLElement; divs: HTMLDivElement[]; }
interface DigitProps { value: string; lastUpdate?: any; }
interface DigitState {
    current: AnimatedDiv;
    next: AnimatedDiv;
    pendingValue: string | null;
}

export class Digit extends Component<DigitContext, DigitProps, DigitState>{
    public static factory: Factory<Digit>;

    public static readonly propMap = {
        value: 1 << 0,
        lastUpdate: 1 << 1
    };
    public static readonly stateMap = {
        pendingValue: 1 << 2,
        next: {
            _isAnimating: 1 << 3,
            $textContent: 1 << 4,
            className: 1 << 5,
            key: 1 << 6
        },
        current: {
            _isAnimating: 1 << 7,
            $textContent: 1 << 8,
            className: 1 << 9,
            key: 1 << 10
        }
    };

    public readonly propMap = Digit.propMap;
    public readonly stateMap = Digit.stateMap;

    private runningAnimateSequence: IterableIterator<void> | null = null;

    public updateView(newProps: DigitProps, newState: DigitState, changeMap: number): void {
        const done = new Set();
        const once = (f: () => void) => () => {
            if (!done.has(f)) {
                done.add(f);
                f();
            }
        };

        const updateCurrent = once(() => {
            updateSpreadElement(this.context.divs[0], newState.current);
        });

        const updateNext = once(() => {
            updateSpreadElement(this.context.divs[1], newState.next);
        });

        const animate = once(() => {
            // requestAnimationFrame(() => {
                if (this.runningAnimateSequence) {
                    const res = this.runningAnimateSequence.next(newState);
                    if (res.done) {
                        this.runningAnimateSequence = null;
                    }
                } else {
                    this.runningAnimateSequence = this.whenAnimate(newState);
                    this.runningAnimateSequence.next(newState);

                }
            // });
        });

        handleChanges(new Map(
            [
                [Digit.propMap.value, noop],
                [Digit.propMap.lastUpdate, () => runtime.updateState(this as Digit, (s: DigitState) => {
                    if (s.pendingValue !== newProps.value) {
                        s.pendingValue = newProps.value;
                        return Digit.stateMap.pendingValue;
                    }
                    return 0;
                })],
                [Digit.stateMap.next._isAnimating, animate],
                [Digit.stateMap.current._isAnimating, animate],
                [Digit.stateMap.pendingValue, animate],
                [Digit.stateMap.current.className, updateCurrent],
                [Digit.stateMap.current.$textContent, updateNext],
                [Digit.stateMap.next.className, updateNext],
                [Digit.stateMap.next.$textContent, updateNext],
            ]
        ), changeMap);
    }

    public $afterMount(_ref: any) {
        this.context.divs[0].addEventListener('animationend', this.animationEndedCurrent);
        this.context.divs[0].addEventListener('transitionend', this.animationEndedCurrent);
        this.context.divs[1].addEventListener('transitionend', this.animationEndedNext);
    }

    private animationEndedCurrent = () => {
        runtime.updateState(this as Digit, (s: DigitState) => {
            s.current._isAnimating = false;
            return Digit.stateMap.current._isAnimating;
        });
    };

    private animationEndedNext = () => {
        runtime.updateState(this as Digit, (s: DigitState) => {
            s.next._isAnimating = false;
            return Digit.stateMap.next._isAnimating;
        });
    };

    private *whenAnimate(newState: DigitState): IterableIterator<void> {
        if (newState.current._isAnimating || newState.next._isAnimating) {
            return;
        }
        runtime.updateState(this as Digit, (s: DigitState) => {
            s.current.className = 'no-transition exit';
            s.next.className = 'no-transition';
            return Digit.stateMap.current.className | Digit.stateMap.next.className;
        });
        newState = yield;
        runtime.updateState(this as Digit, (s: DigitState) => {
            s.current.className = '';
            s.next.className = 'waiting';
            s.current.$textContent = s.next.$textContent;
            return Digit.stateMap.current.className | Digit.stateMap.next.className | Digit.stateMap.current.$textContent;
        });
        newState = yield;
        if (newState.pendingValue !== null) {
            runtime.updateState(this as Digit, (s: DigitState) => {
                s.next._isAnimating = s.current._isAnimating = true;
                s.next.$textContent = newState.pendingValue!;
                s.pendingValue = null;
                s.next.className = '';
                s.current.className = 'exit';
                return Digit.stateMap.current.className | Digit.stateMap.pendingValue
                    | Digit.stateMap.next.className | Digit.stateMap.next.$textContent;
            });
        }
    }
}

const initialState = (props: DigitProps): DigitState => ({
    current: { $textContent: props.value || ' ', className: 'enter', _isAnimating: true, key: 'current' },
    next: { $textContent: ' ', className: 'waiting', _isAnimating: false, key: 'next' },
    pendingValue: null
});


Digit.factory = {
    unique: Symbol('DigitFactory'),
    toString: (props: DigitProps, state?: DigitState) => {
        state = state || initialState(props);
        return `<div class="digit">
            ${[state.current, state.next].map(i => spreadToElementString('div', i)).join('')}
        </div>`;
    },
    hydrate: (root: HTMLElement, props: DigitProps, state?: DigitState) =>
        new Digit({
            root,
            divs: root.children as unknown as HTMLDivElement[]
        }, props, state || initialState(props)),
    initialState
} as Factory<Digit>;

export const runExample = (target: HTMLElement) => {
    let val = 0;
    const comp = runtime.render(target, Digit.factory, { value: '*' })!;
    const intId = setInterval(() => {
        runtime.updateProps(comp as Digit, (p: DigitProps) => {
            p.lastUpdate = Date.now();
            if (p.value !== '' + val) {
                p.value = '' + val;
                return Digit.propMap.value | Digit.propMap.lastUpdate;
            }
            return Digit.propMap.lastUpdate;
        });
        val++;
        val %= 10;
    }, 1000);
    return () => clearInterval(intId);
};
