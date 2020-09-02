import { TSXAir, store, when, TsxAirChild, afterMount, afterDomUpdate } from '@tsx-air/framework';
import { compact, hasIn } from 'lodash';

export const WithFactory = TSXAir((props: { factory: (name: string) => TsxAirChild<any> }) => {
    const state = store({ first: '1', second: '2' });
    return <div onClick={() => { state.first = 'First!'; }}>
        {props.factory(state.first)}
        {props.factory(state.second)}
    </div>;
});

export const FactoryWrapper = TSXAir((props: { lastName: string }) => {
    const factory = (name: string) => <div>{name} {props.lastName}</div>;
    return <WithFactory factory={factory} />;
});

export const FaderParent = TSXAir(() => {
    const state = store({
        items: [1, 2, 3]
    });
    state.items = [state.items[0], state.items[1], 5];
    return <div onClick={() => state.items = [0]}>
        <Fader child={state.items[0] ? <div>{state.items[0]}</div> : undefined} />
        <Fader child={state.items[1] ? <div>{state.items[1]}</div> : undefined} />
        <Fader child={state.items[2] ? <div>{state.items[2]}</div> : undefined} />
    </div>;
});

export const Fader = TSXAir((props: { child: TsxAirChild<any> | undefined }) => {
    const state = store({
        // child: cloneElement(props.child, 'child', {}),
        child: props.child,
    });

    when(props.child, () => {
        if (props.child) {
            state.child = props.child;
        } else {
            setTimeout(() => { state.child = undefined }, 100);
        }
    });
    return <div className={props.child ? '' : 'fade'}>{state.child}</div>;
});

// wrapped in component context
const useMouseLocation = Hook(( /* ... componentInstance */) => {
const useMouseLocation = (( /* ... componentInstance */) => {
    const mouse = store({
        x: -1, y: -1, pagex: -1, pagey: -1
    });

    afterMount(() => {
        const handler = e => {
            mouse.x = e.clientX;
        };
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    });

    return mouse;
})

function usePhysicalLocation() {
    const location = store({
        x: -1, y: -1, width: -1, height: -1
    });

    afterMount(ref => {
        const intId = setInterval(() => {
            const rect = ref.getBoundingClientRect()[0];
            location.x = rect.clientX;
        }, 50);
        return () => clearInterval(intId);
    });

    return location;
}

function useMouseAngle() {
    // syntax 
    const mouse = use(mouseLocation());
    const location = usePhysicalLocation();
    return mouse.x/location.x;
}

export const Googly = TSXAir(() => {
    const angle = useMouseAngle();
    return <img src="eye.png" style={{rotate:angle + 'deg'}} />;
})

function useState(value) {
    const state = store({value});
    return [value, v => state.value = v];
}
