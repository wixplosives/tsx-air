import { GooglyEyes } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = GooglyEyes.render({}, element, 'append');