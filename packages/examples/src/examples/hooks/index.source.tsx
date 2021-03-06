import { Hook, store, afterMount, use, afterDomUpdate, TSXAir } from '@tsx-air/framework';

const mouseLocation = Hook(() => {
    const mouse = store({
        x: -1,
        y: -1
    });

    afterMount(() => {
        const handler = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    });

    return mouse;
});

const mouseOffset = Hook((radiusFactor:number) => {
    const mouse = use(mouseLocation());
    const state = store({ x: 0, y: 0 });
    const view = store({ eye: null as HTMLElement | Text | null });

    const calc = (eye: HTMLElement | Text | null) => {
        if (eye && eye instanceof HTMLElement) {
            const { left, right, top, bottom, width, height } = eye.getClientRects()[0];
            const offsetX = mouse.x - (left + right) / 2;
            const offsetY = mouse.y - (top + bottom) / 2;
            const lengthSqr = Math.sqrt(offsetX ** 2 + offsetY ** 2);
            const maxLengthSqr = Math.sqrt((width / radiusFactor) ** 2 + (height / radiusFactor) ** 2);
            const shrinkRatio = lengthSqr > maxLengthSqr
                ? (maxLengthSqr / lengthSqr)
                : 1;
            state.x = Math.round(offsetX * shrinkRatio);
            state.y = Math.round(offsetY * shrinkRatio);
        }
    };
    afterDomUpdate(eye => {
        view.eye = eye;
        calc(eye);
    });
    calc(view.eye);
    return state;
});

const Eye = TSXAir(() => {
    const offset = use(mouseOffset(6));
    return <div className="eye"><div style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} /></div>;
});

export const GooglyEyes = TSXAir(() => <div className="face">
    <Eye /><Eye />
    <div className="smile" />
</div>);
