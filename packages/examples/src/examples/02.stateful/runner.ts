import { StatefulComp } from './index.source';
import { render } from '@tsx-air/framework';

export const runExample = (target: HTMLElement) => {
    render(target, StatefulComp, { initialState: 'Click me!' });
};