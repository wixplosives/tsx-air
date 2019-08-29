// tslint:disable: label-position
import { TSXAir, render, lifecycle } from '../../framework/runtime/runtime2';
export const StatefulComp = TSXAir((props: { seconds: number }) => {
    let { counter, clickeCounter, label } = lifecycle.memo(() => ({
        counter: 0,
        clickeCounter: 0,
        label: ''
    }));
    label = `seconds : ${props.seconds} renders: ${++counter} clicks: ${clickeCounter}\n` + label;
    const onClickA = () => { clickeCounter++; clickeCounter++; };
    return <pre onClick={onClickA}>
        {label}
    </pre>;

});


export interface StatefulCompState{
    counter: number;
    clickCounter: number;
    label: string;
}

export const StatefulComp5 = TSXAir<{ seconds: number }, StatefulCompState>((props, {
    counter = 0,
    clickCounter = 0,
    label = ''
}) => {
    
    label = `seconds : ${props.seconds} renders: ${++counter} clicks: ${clickCounter}\n` + label;
    const onClickA = () => { clickCounter++; };
    return <pre onClick={onClickA}>
        {label}
    </pre>;

});


export const StatefulComp1 = TSXAir((props: { seconds: number }) => {
    let counter = 0;
    let clickeCounter = 0;
    let label = '';

    label = `seconds : ${props.seconds} renders: ${++counter} clicks: ${clickeCounter}\n` + label;
    const onClickA = () => { clickeCounter++; };
    return <pre onClick={onClickA}>
        {label}
    </pre>;

});

export const StatefulComp3 = TSXAir((props: { seconds: number }) => {
    let counter = 0;
    let clickeCounter = 0;
    let label = '';
   
    $: label = `seconds : ${props.seconds} renders: ${++counter} clicks: ${clickeCounter}\n` + label;
    const onClickA = () => {
        clickeCounter++;
    };

    return <pre onClick={onClickA}>
        {label}
    </pre>;

});

export const StatefulComp2 = TSXAir((props: { seconds: number }) => {
    const [counter, setCounter] = lifecycle.state(0);
    const [clickeCounter, setClickCounter] = lifecycle.state(0);
    const [label, setLabel] = lifecycle.state('');

    const newLabel = `seconds : ${props.seconds} renders: ${counter + 1} clicks: ${clickeCounter}\n` + label;
    setLabel(newLabel);
    setCounter(counter + 1);
    const onClickA = () => { setClickCounter(clickeCounter + 1); };
    return <pre onClick={onClickA}>
        {newLabel}
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