// No need to import anything you're not going to use
import { TSXAir, afterMount, store, afterDomUpdate, RefHolder } from '@tsx-air/framework';

export const Clock = TSXAir((props: { title: string }) => {
    const state = store({
        time: 'Not set',
        titleRef: {} as RefHolder<HTMLHRElement>,
        area: 0,
        updatesCount: 0,
        recursiveChanges: 0
    });

    afterMount(ref => {
        const intervalId = window.setInterval(() => (state.time = new Date().toTimeString()), 200);
        (ref as HTMLElement).querySelector('a')?.focus();
        return () => clearInterval(intervalId);
    });

    afterDomUpdate(props.title, () => {
        const { width, height } = state.titleRef.element!.getClientRects()[0];
        state.updatesCount++;
        state.area = Math.round(width * height);
    });

    afterDomUpdate((_ref, consecutiveChanges) => {
        if (consecutiveChanges < 10) {
            state.recursiveChanges++;
        }
    });

    return <div>
        <a href="#"><h1 ref={state.titleRef}>{props.title}</h1></a>
        <div className="time">{state.time}</div>
        <div className="area">Title area: {state.area}px²</div>
        <div>
            <h2>Changes count:</h2>
            <div className="title-updated">Title updates: {state.updatesCount}</div>
            <div className="any-updated">Total updates: {state.recursiveChanges}</div>
        </div>
    </div>;
});