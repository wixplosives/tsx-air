import { StatefulComp } from './index.source';

export const runExample = (target: HTMLElement) => {
    StatefulComp.render({ initialState: 'Click me!' }, undefined, target, 'append');
};

export { StatefulComp as Component };