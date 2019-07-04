import { TSXAir } from '../framework/runtime';
import React, { useState } from 'react';
export const ParentComp = TSXAir((props: { initialState: string }) => {
    const [state, setState] = useState(props.initialState);
    const [state1, setState1] = useState(props.initialState);
    return <div>
        <div onClick={() => setState(state + 'a')}>
            ${state}
        </div>
        <div onClick={() => setState1(state1 + 'a')}>
            ${state1}
        </div>
    </div>;

}
);