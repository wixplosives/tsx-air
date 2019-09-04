// tslint:disable: jsx-no-lambda
// tslint:disable: label-position
import { TSXAir, TSXAir2, render, getState } from '../../framework/runtime/runtime2';

/**
 * outlined in this file are different syntax suggestions for TSX AIR
 */




export const StatefulComp = TSXAir2((props: { seconds: number }) => {
    const state = getState({
        counter: 0,
        clickeCounter: 0,
        label: ''
    });
    if(state.clickeCounter > 0){
        state.label = `seconds : ${props.seconds} renders: ${++state.counter} clicks: ${state.clickeCounter}\n` + state.label;
    }else{
        state.label = `seconds : ${props.seconds}\n` + state.label;
    }
    
    const onClickA = () => { state.clickeCounter++; state.clickeCounter++; };
    return <pre onClick={onClickA}>
        {state.label}
    </pre>;

});

export const runExample = (element: HTMLElement) => {
    let current = 0;
    const comp = render(element, StatefulComp, { seconds: current })!;
    const i = setInterval(() => {
        current++;
        comp.update({ seconds: current });
    }, 1000);
    return () => {
        clearInterval(i);
    };
};