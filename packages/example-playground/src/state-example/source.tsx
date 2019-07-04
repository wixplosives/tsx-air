import { TSXAir } from '../framework/runtime';
import React, { useState } from 'react';
export const ParentComp = TSXAir((props: { initialState: string }) => {
    const [state, setState] = useState(props.initialState);
    return <div onClick={() => setState(state + 'a')}>
        ${state}
    </div>;
}
);