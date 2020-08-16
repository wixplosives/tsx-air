import { TSXAir, store, when, TsxAirChild } from '@tsx-air/framework';

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

// export const FaderParent = TSXAir(()=>{    
//     const state = store({
//         items:[1,2,3]
//     });
//     state.items = [state.items[0], state.items[1], 5];
//     return <div onClick={()=>state.items  = [0]}>
//         <Fader child={state.items[0]? <div>{state.items[0]}</div> : undefined}/>
//         <Fader child={state.items[1]? <div>{state.items[1]}</div> : undefined}/>
//         <Fader child={state.items[2]? <div>{state.items[2]}</div> : undefined}/>
//         </div>;
// });

// export const Fader = TSXAir((props: { child: TsxAirChild<any> | undefined }) => {
//     const state = store({
//         // child: cloneElement(props.child, 'child', {}),
//         child: props.child,
//     });

//     when(props.child, () => {
//         if (props.child) {
//             state.child = props.child;
//         } else {
//             setTimeout(() => { state.child = undefined }, 100);
//         }
//     });
//     return <div className={props.child ? '' : 'fade'}>{state.child}</div>;
// });