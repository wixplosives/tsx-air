import { Component, VirtualElement, CompFactory, Fragment, Factory } from '@tsx-air/framework';
import { TSXAir } from '@tsx-air/framework';
// tslint:disable

interface StatefulCompSourceState {
    a: string;
    b: string;
    aCounter: number;
    bCounter: number;
    changeCount: number;
}
interface StatefulCompSourceProps {
    initialState: string;
}
class BaseCompiledStore {

}

class StatefulCompState extends BaseCompiledStore implements CompiledStore<StatefulCompSourceState> {
    get a() {
        return this.$data.a;
    }
    get b() {
        return this.$data.b;
    }
    get aCounter() {
        return this.$data.aCounter;
    }
    get bCounter() {
        return this.$data.bCounter;
    }
    get changeCount() {
        return this.$data.changeCount;
    }

    set a(val: StatefulCompSourceState['a']) {
        this.$data.a = val;
        this.$dispatch(this.$bits.a);
    }
    set b(val: StatefulCompSourceState['b']) {
        this.$data.b = val;
        this.$dispatch(this.$bits.b);
    }
    set aCounter(val: StatefulCompSourceState['aCounter']) {
        this.$data.aCounter = val;
        this.$dispatch(this.$bits.aCounter);
    }
    set bCounter(val: StatefulCompSourceState['bCounter']) {
        this.$data.bCounter = val;
        this.$dispatch(this.$bits.bCounter);
    }
    set changeCount(val: StatefulCompSourceState['changeCount']) {
        this.$data.changeCount = val;
        this.$dispatch(this.$bits.changeCount);
    }

    public $bits = {
        a: 1 << 1,
        aCounter: 1 << 2,
        b: 1 << 3,
        bCounter: 1 << 4,
        changeCount: 1 << 5
    };
    public $data: StatefulCompSourceState;
    constructor(props: CompiledStore<any>) {
        super();
        this.$data = {
            a: props.initialState + 'A',
            b: props.initialState + 'B',
            aCounter: 0,
            bCounter: 0,
            changeCount: 0
        };
    }
}
class StatefulCompProps extends BaseCompiledStore implements CompiledStore<StatefulCompSourceProps> {
    $bits = {
        initialState: 1
    };
    $data: StatefulCompSourceProps;
    get initialState() {
        return this.$data.initialState;
    }
    set initialState(val: StatefulCompSourceProps['initialState']) {
        this.$data.initialState = val;
        this.$dispatch(this.$bits.initialState);
    }
    constructor(props: CompiledStore<any>) {
        super();
        this.$data = {
            initialState: 'bla'
        };
    }
}

// tslint:disable
const StatefulComp = /** @class */ (() => {
    class StatefulComp extends Component {
        onClickA: () => void;
        onClickB: () => void;
        constructor() {
            super(...arguments);

            this.onClickA = (...args) => this._onClickA(...args);
            this.onClickB = (...args) => this._onClickB(...args);
        }
        preRender() {
            const { props } = this.stores;
            const store = this.store;
            /////////////
            const state = store(
                {
                    a: props.initialState + 'A',
                    b: props.initialState + 'B',
                    aCounter: 0,
                    bCounter: 0,
                    changeCount: 0
                },
                'state'
            );
            const { onClickA, onClickB } = this;
            let volatile = 0;
            volatile++;
            state.changeCount += volatile;
            /////////////
            this.volatile = { volatile, onClickA, onClickB };
            return VirtualElement.fragment('0', StatefulComp.div0, this);
        }
        _onClickA() {
            const { props } = this;
            const { state } = this.stores;
            state.a = `${props.initialState} A (${++state.aCounter})`;
        }
        _onClickB() {
            const { props } = this;
            const { state } = this.stores;
            state.b = `${props.initialState} B (${++state.bCounter})`;
        }
    }
    StatefulComp.factory = new CompFactory(
        StatefulComp,
        {
            'props.initialState': 1 << 0,
            'state.a': 1 << 1,
            'state.aCounter': 1 << 2,
            'state.b': 1 << 3,
            'state.bCounter': 1 << 4,
            'state.changeCount': 1 << 5
        },
        props => ({
            state: {
                a: props.initialState + 'A',
                b: props.initialState + 'B',
                aCounter: 0,
                bCounter: 0,
                changeCount: 0
            }
        })
    );
    return StatefulComp;
})();
export { StatefulComp };
{
    const div0 = /** @class */ (() => {
        class div0 extends Fragment {
            updateView() {
                const { state } = this.stores;
                const stateChanged = this.modified.get(state) || 0;
                if (stateChanged & state.$bits.a) {
                    $rt().updateExpression(this.ctx.expressions[0], state.a);
                }
                if (stateChanged & state.$bits.b) {
                    $rt().updateExpression(this.ctx.expressions[1], state.b);
                }
                if (stateChanged & state.$bits.changeCount) {
                    $rt().updateExpression(this.ctx.expressions[2], state.changeCount);
                }
            }
            toString() {
                const { state } = this.stores;
                const { volatile } = this.volatile;
                return this.unique(`<div>
            <div class="btn" x-da="!">
                <!--X-->${$rt().toString(state.a)}<!--X-->
            </div>
            <div class="btn" x-da="!">
                <!--X-->${$rt().toString(state.b)}<!--X-->
            </div>
            <div class="changeCount">View rendered <!--X-->${$rt().toString(
                    state.changeCount
                )}<!--X--> times</div>
            
            <div class="volatile">volatile variable is still at <!--X-->${$rt().toString(
                    volatile
                )}<!--X--></div>
        </div>`);
            }
            hydrate(_, t) {
                const { state } = this.stores;
                const { volatile } = this.volatile;
                this.hydrateExpressions([state.a, state.b, state.changeCount, volatile], t);
                this.hydrateElements(t);
                this.ctx.elements[0].addEventListener('click', this.owner.onClickA);
                this.ctx.elements[1].addEventListener('click', this.owner.onClickB);
                this.ctx.root = t;
            }
        }
        div0.factory = new Factory(div0, StatefulComp.changesBitMap);
        return div0;
    })();
    StatefulComp.div0 = div0;
}
