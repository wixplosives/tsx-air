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
        updatesCount: 0
    };
    const clock = document.createElement('div');
    clock.innerHTML = ` <a href="#">
    <h1>${props.title}</h1></a>
    <h2>Title area: ${state.area}px²</h2>
    <h3>Title updated ${state.updatesCount} times</h3>
    <div class="time">${state.time}</div>`;

    const update = () => {
        const { width, height } = clock.querySelector('h1')!.getClientRects()[0];
        state.updatesCount++;
        state.area = Math.round(width * height);
        clock.querySelector('h2')!.textContent = `Title area: ${state.area}px²`;
        clock.querySelector('h3')!.textContent = `Title updated ${state.updatesCount} times`;
    };
    target.append(clock);

    requestAnimationFrame(update);

    window.setInterval(() => {
        state.time = new Date().toTimeString();
        clock.querySelector('.time')!.textContent = state.time;
    }, 100);
    clock.querySelector('a')?.focus();

    return {
        updateProps: (p: Props) => {
            clock.querySelector('h1')!.textContent = props.title = p.title;
            requestAnimationFrame(update);
        },
    } as ComponentApi<Props>;
};
