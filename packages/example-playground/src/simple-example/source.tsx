import { TSXAir } from '../framework/runtime';
import React from 'react';
export const ChildComp = TSXAir((props: { name: string }) => <div>hello {props.name} </div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
        hello {props.name}xxx
        <ChildComp name={props.name} />
    </div>
)
);