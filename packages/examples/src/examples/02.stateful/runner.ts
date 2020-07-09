import { StatefulComp } from './index.source';

export const runExample = (target: HTMLElement) => {
    StatefulComp.render({ initialState: 'Click me!' }, target, 'append');
};

export { StatefulComp as Component };