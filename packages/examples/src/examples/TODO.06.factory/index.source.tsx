import { TSXAir, store, when, TsxAirChild, memo, afterMount, afterDomUpdate, RefHolder, beforeUnmount } from '@tsx-air/framework';

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

const GoogleMaps = TSXAir((props: { title: string, subtitle: string }) => {
    const heading = {} as RefHolder<HTMLDivElement>;
    const h1 = {} as RefHolder<HTMLHeadingElement>;

    afterDomUpdate(() => {

    });
    return <div>
        <div ref={heading}>
            <h1 ref={h1}>{props.title}</h1>
            <span>{props.subtitle}</span>
        </div>
        h1 area: {}                
    </div>;
});

const Clock = TSXAir(() => {
    const state = store({time:'', intervalId:-1});   
    afterMount(()=>{
        state.intervalId = window.setInterval(()=>state.time = new Date().toTimeString(), 1000);        
    });
    beforeUnmount(()=>{
        clearInterval(state.intervalId);
    });  
    return <div>{state.time}</div>;
});


export const DeepStore = TSXAir((s: { getValue: () => any, getVersion: () => number, subscribe: any, unsubscribe: any }) => {
    const v = store({ value: 0, version: -1 });
    when(s, () => {
        const update = () => {
            if (s.getVersion() !== v.version) {
                v.value = s.getValue();
            }
        };


        s.subscribe(update);
        return () => s.unsubscribe(update);
    });
    return <div onClick={() => state.items = [0]}>
        <Fader child={state.items[0] ? <div>{state.items[0]}</div> : undefined} />
        <Fader child={state.items[1] ? <div>{state.items[1]}</div> : undefined} />
        <Fader child={state.items[2] ? <div>{state.items[2]}</div> : undefined} />
    </div>;
});