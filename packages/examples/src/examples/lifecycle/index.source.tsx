// No need to import anything you're not going to use
import { TSXAir, afterMount, store, afterDomUpdate, RefHolder } from '@tsx-air/framework';

export const Clock = TSXAir((props: { title: string }) => {
    const state = store({
        time: 'Not set',
        titleRef: {} as RefHolder<HTMLHRElement>,
        area: 0,
        updatesCount:0
    });

    afterMount(ref => {
        const intervalId = window.setInterval(() => (state.time = new Date().toTimeString()), 100);
        ref.querySelector('a')?.focus();
        return () => clearInterval(intervalId);
    });

    afterDomUpdate(props.title, () => {
        const { width, height } = state.titleRef.element!.getClientRects()[0];
        state.updatesCount++;
        state.area = Math.round(width * height);
    });

    return <div>
        <a href="#"><h1 ref={state.titleRef}>{props.title}</h1></a>
        <h2>Title area: {state.area}px²</h2>
        <h3>Title updated {state.updatesCount} times</h3>
        <div className="time">{state.time}</div>
    </div>;
});