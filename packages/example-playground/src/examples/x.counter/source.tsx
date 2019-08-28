import { TSXAir, render } from '../../framework/runtime/runtime2';
export const StatefulComp = TSXAir((props: { seconds: number }) => {

    let counter = 0;
    let clickeCounter = 0;
    let label = '';
    label = `seconds : ${props.seconds} renders: ${++counter} clicks: ${clickeCounter}\n` + label;
    const onClickA = () => clickeCounter++;
    return <pre onClick={onClickA}>
        {label}
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