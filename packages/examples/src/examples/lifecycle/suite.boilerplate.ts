import { Clock } from './index.source';

const element = document.querySelector('div');
(globalThis as any).app = Clock.render({ title: `Test` },  element!, 'append');
