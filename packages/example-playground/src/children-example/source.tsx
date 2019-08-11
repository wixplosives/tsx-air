import { TSXAir } from '../framework/runtime';
import React, { useState } from 'react';

const colors = ['red', 'blue', 'green'];
export const ContainerComp = TSXAir((props: { child: JSX.Element }) => {
    const [numColors, updateNumColors] = useState(0);
    const usedColors = colors.slice(0, numColors);
    const handler = () => updateNumColors(numColors + 1);
    return <div onClick={handler}>
        {
            usedColors.map(color => React.cloneElement(props.child, { style: { color }, key: color }))
        }
    </div>;

});


export const ParentComp = TSXAir((props: { title: string }) => {

    return <ContainerComp child={<div>{props.title}</div>} />;

});