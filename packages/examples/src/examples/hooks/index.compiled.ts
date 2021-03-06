import { CompCreator } from '@tsx-air/framework/src/api/types';
import { RenderTarget, ComponentApi } from '@tsx-air/framework/src';


export const GooglyEyes: CompCreator<{}> = (props: {}) => ({ props });

GooglyEyes.render = (_: {}, target?: HTMLElement, add?: RenderTarget) => {
    if (!target || add !== 'append') {
        throw new Error('Now supported in this example');
    }

    const Eye = `<div class="eye"><div></div></div>`;
    target.innerHTML = `<div class="face">
    ${Eye}${Eye}
        <div class="smile"></div>
    </div>`;

    const eyes = target.querySelectorAll('.eye') as any as HTMLDivElement[];

    const mouse = { x: -1, y: -1 };
    const handler = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        requestAnimationFrame(updateView);
    };
    const updateView = () => {
        // debugger
        eyes.forEach(eye => {
            const offset = getEyeState(eye);
            eye.children[0].setAttribute('style', `transform: translate(${offset.x}px, ${offset.y}px)`);
        });
    };
    const getEyeState = (eye: HTMLDivElement) => {
        const state = { x: 0, y: 0 };
        const radiusFactor = 6;

        const { left, right, top, bottom, width, height } = (eye as HTMLElement).getClientRects()[0];
        const offsetX = mouse.x - (left + right) / 2;
        const offsetY = mouse.y - (top + bottom) / 2;

        const lengthSqr = Math.sqrt(offsetX ** 2 + offsetY ** 2);
        const maxLengthSqr = Math.sqrt((width / radiusFactor) ** 2 + (height / radiusFactor) ** 2);
        const shrinkRatio = lengthSqr > maxLengthSqr
            ? (maxLengthSqr / lengthSqr)
            : 1;
        state.x = Math.round(offsetX * shrinkRatio);
        state.y = Math.round(offsetY * shrinkRatio);
        return state;
    };

    window.addEventListener('mousemove', handler);

    return {
        dispose: () => {
            window.removeEventListener('mousemove', handler);
        }
    } as ComponentApi<{}>;
};