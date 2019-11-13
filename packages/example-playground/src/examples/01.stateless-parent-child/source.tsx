// No need to import anything you're not going to use
import { TSXAir, render } from '../../framework';

// Components are TSX functions wrapped by TSXAir
export const ChildComp = TSXAir((props: { name: string }) => <div className="child">Child: {props.name}</div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div className="parent">
        Parent: {props.name}
        <ChildComp name={props.name} />
    </div>
));

export const runExample = (element: HTMLElement) => {
    const countTo = 100;
    let count = 0;
    let frames = 0;
    const startTime = performance.now();
    const app = render(element, ParentComp, { name: `Initial count: ${count}` });
    const isViewUpdated = () => {
        const countDisplayed = element.innerText.match(new RegExp(`${count}`, 'g'));
        return (countDisplayed && countDisplayed.length === 2);
    };
    const summery = () => {
        const duration = Math.round(performance.now() - startTime);
        return `It took ${frames} frames (${duration}mSec) to update the view ${countTo} times.
                Thats ${(frames / countTo).toFixed(2)} frames/update at ${(frames / duration * 1000).toFixed(2)} FPS`;
    };

    const framesCounter = () => {
        frames++;
        if (isViewUpdated()) {
            app.updateProps({ name: `Updated ${++count} times` });
        }
        if (count <= countTo) {
            requestAnimationFrame(framesCounter);
        } else {
            app.updateProps({ name: summery() });
        }
    };

    framesCounter();
};