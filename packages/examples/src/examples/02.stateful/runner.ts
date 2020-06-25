import { StatefulComp } from './index.source';
import { render } from '@tsx-air/framework';

export const runExample = (target: HTMLElement) => {
    render(StatefulComp, { initialState: 'Click me!' }, undefined, target, 'append')
};

export { StatefulComp as Component };