import { TSXAir, store } from '@tsx-air/framework';

export const StatefulComp = TSXAir((props: { initialState: string }) => {
    const state = store({
        a: props.initialState + 'A',
        b: props.initialState + 'B',
        aCounter: 0,
        bCounter: 0,
        changeCount: 0
    });
    let volatile = 0;

    const onClickA = () => state.a = `${props.initialState} A (${++state.aCounter})`;
    const onClickB = () => state.b = `${props.initialState} B (${++state.bCounter})`;

    /* shorthand for
        when(always, () => state.changeCount++);
    */
    volatile++; // should always be 1
    state.changeCount += volatile;

    return (
        <div>
            <div className="btn" onClick={onClickA}>
                {state.a}
            </div>
            <div className="btn" onClick={onClickB}>
                {state.b}
            </div>
            <div className="changeCount">state changed {state.changeCount} times</div>
            {/*  The following will fail at compile time
                <div>state changed {state.changeCount++} times</div> 
            Because the state should never be changed declaratively
        */}
            <div className="volatile">volatile variable is still at {volatile}</div>
        </div>
    );
});
