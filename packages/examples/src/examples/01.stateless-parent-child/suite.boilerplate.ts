import { ParentComp } from './index.source';

const element = document.querySelector('div');
(globalThis as any).app = ParentComp.render({ name: `Test` }, {}, element!, 'append');
