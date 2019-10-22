import { Runtime } from './../../runtime/runtime';



class FrameworkController {
    private pending = [] as FrameRequestCallback[];

    constructor(readonly target: Runtime) { }

    pause = () => {
        this.target.$tick = this.addToPending;
    };

    tick = () => {
        if (this.pending.length) {
            const action = this.pending.shift();
            action(performance.now());
        }
    };

    play = () => {
        this.target.$tick = window.requestAnimationFrame;
    };

    private addToPending = (callback: FrameRequestCallback) => {
        this.pending.push(callback);
        return 0;
    };
}