import { CompCreator } from '@tsx-air/framework/src/api/types';
import { RenderTarget, ComponentApi } from '@tsx-air/framework/src';

interface Props {
    title: string;
}
export const Clock: CompCreator<Props> = (props: Props) => ({
    props
});
Clock.render = (props: Props, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw new Error('Now supported in this example');
    }
    const state = {
        time: 'Not set',
        area: 0,
        updatesCount: 0,
        recursiveChanges: 0
    };
    const clock = document.createElement('div');
    clock.innerHTML = `<a href="#"><h1>${props.title}</h1></a>
        <div class="time">${state.time}</div>
        <div class="area">Title area: ${state.area}px²</div>
        <div>
            <h2>Changes count:</h2>
            <div class="title-updated">Title updates: ${state.updatesCount}</div>
            <div class="any-updated">Total updates: ${state.recursiveChanges}</div>
        </div>`;

    const updateTitle = () => {
        const { width, height } = clock.querySelector('h1')!.getClientRects()[0];
        state.updatesCount++;
        state.area = Math.round(width * height);
        clock.querySelector('.area')!.textContent = `Title area: ${state.area}px²`;
        clock.querySelector('.title-updated')!.textContent = `Title updates: ${state.updatesCount}`;
        updateAny();
    };
    let consecutiveChanges = 0;
    const updateAny = () => {
        if (consecutiveChanges++ < 10) {
            state.recursiveChanges++;
            clock.querySelector('.any-updated')!.textContent = `Total updates: ${state.recursiveChanges}`;
            requestAnimationFrame(updateAny);
        } else {
            consecutiveChanges = 0;
        }
    };
    target.append(clock);

    requestAnimationFrame(updateTitle);

    window.setInterval(() => {
        const oldTime = state.time;
        state.time = new Date().toTimeString();
        clock.querySelector('.time')!.textContent = state.time;
        if (state.time !== oldTime) {
            requestAnimationFrame(updateAny);
        }
    }, 100);
    clock.querySelector('a')?.focus();

    return {
        updateProps: (p: Props) => {
            clock.querySelector('h1')!.textContent = props.title = p.title;
            requestAnimationFrame(updateTitle);
        },
    } as ComponentApi<Props>;
};
