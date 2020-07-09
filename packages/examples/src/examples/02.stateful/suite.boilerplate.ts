import { StatefulComp } from './index.source';

const element = document.querySelector('div');
(globalThis as any).app = StatefulComp.render({ initialState: 'Button' }, element!, 'append');