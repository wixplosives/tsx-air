import { render } from '@tsx-air/framework';
import { ParentComp } from './index.source';

const element = document.querySelector('div');
(globalThis as any).app = render(ParentComp, { name: `Test` }, {}, element!, 'append');
