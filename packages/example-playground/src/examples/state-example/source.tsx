import { TSXAir } from '../../framework/runtime';
import React, { useState } from 'react';
export const ParentComp = TSXAir((props: { initialState: string }) => {
    const [state, setState] = useState(props.initialState);
    const [state1, setState1] = useState(props.initialState);
    
    const onClick = () => setState(state + '!');
    const onClick1 = () => setState1(state1 + '*');

    return <div>
        <div onClick={onClick}>
            ${state}
        </div>
        <div onClick={onClick1}>
            ${state1}
        </div>
    </div>;
});
