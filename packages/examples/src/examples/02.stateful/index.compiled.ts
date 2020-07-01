import { CompCreator } from "@tsx-air/framework/src/api/types";
import { RenderTarget, ComponentApi } from "@tsx-air/framework/src";

interface Props {
    initialState: string
}
export const StatefulComp: CompCreator<Props> = (props: Props) => ({
    props
});
StatefulComp.render = (props: Props, _?: object, target?: HTMLElement, add?: RenderTarget) => {
    const state = {
        a: props.initialState + 'A',
        b: props.initialState + 'B',
        aCounter: 0,
        bCounter: 0,
        changeCount: 0
    };
    let volatile = 0;
    volatile++;

    const onClickA = () => {
        state.a = `${props.initialState} A (${++state.aCounter})`;
        updateView();
    };
    const onClickB = () => {
        state.b = `${props.initialState} B (${++state.bCounter})`;
        updateView();
    }

    if (!target || add !== 'append') {
        throw 'Now supported in this example';
    }

    target.innerHTML = `<div>
<div class="btn">
    ${state.a}
</div>
<div class="btn">
    ${state.b}
</div>
<div class="changeCount">View rendered ${state.changeCount} times</div>
<div class="volatile">volatile variable is still at ${volatile}</div>
</div>`
    const divs = target.children[0].querySelectorAll('div');
    divs[0].addEventListener('click', onClickA);
    divs[1].addEventListener('click', onClickB);

    const updateView = () => {
        let volatile = 0;
        volatile++;
        state.changeCount += volatile;
        divs[0].textContent = state.a
        divs[1].textContent = state.b
        divs[2].textContent = `View rendered ${state.changeCount} times`;
        divs[3].textContent = `volatile variable is still at ${volatile}`;
    }
    updateView();
    return {
        updateProps: (props: Props) => {
        },
    } as ComponentApi<Props>;
}
