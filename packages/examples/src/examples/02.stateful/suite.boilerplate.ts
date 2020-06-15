import { render } from '@tsx-air/framework';
import { StatefulComp } from './index.source';

const element = document.querySelector('div');
(globalThis as any).app = render(StatefulComp, { initialState: 'Button' }, undefined, element!, 'append');