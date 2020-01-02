import { render, TSXAir, store } from '@tsx-air/framework';

export const StatefulComp = TSXAir((props: { initialState: string }) => {
    const state = store({ a: props.initialState, b: props.initialState, changeCount: 0 });

    const onClickA = () => state.a = state.a + '!';
    const onClickB = () => state.b = state.b + '*';

    state.changeCount++;
    /* 
    // that's the equivalent of
        when(always, () => state.changeCount++);
    */

    return <div>
        <div className="btn" onClick={onClickA}>
            {state.a}
        </div>
        <div className="btn" onClick={onClickB}>
            {state.b}
        </div>
        <div>state changed {state.changeCount} times</div>
        {/* 
        // The following will fail at compile time
        <div>state changed {state.changeCount++} times</div> 
        */}
    </div>;
});

