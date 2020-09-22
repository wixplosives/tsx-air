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

const mouseOffset = Hook((threshold: number = 5) => {
    const mouse = use(mouseLocation());
    const state = store({ x: 0, y: 0 });

    afterDomUpdate(domElement => {
        const { left, right, top, bottom, width, height } = (domElement as HTMLElement).getClientRects()[0];
        const offsetX = (left + right) / 2 - mouse.x;
        const offsetY = (top + bottom) / 2 - mouse.y;

        const lengthSqr = offsetX ** 2 + offsetY ** 2;
        const maxLengthSqr = width ** 2 + height ** 2;
        if (length < threshold) {
            state.x = state.y = 0;
        } else {
            const shrinkRatio = lengthSqr > maxLengthSqr
                ? Math.sqrt(maxLengthSqr / lengthSqr)
                : 1;
            state.x = offsetX * shrinkRatio;
            state.y = offsetY * shrinkRatio;
        }
    });
    return state;
});

export const GooglyEye = TSXAir(() => {
    const offset = use(mouseOffset(5));
    return <div className="eye"><div style={{ transform: `translate(${offset.x}px, ${offset.y}px)`}} /></div>;
});

export const GooglyEyes = TSXAir(() => <div className="face">
    <GooglyEye /><GooglyEye />
    <div className="smile" />
</div>);
