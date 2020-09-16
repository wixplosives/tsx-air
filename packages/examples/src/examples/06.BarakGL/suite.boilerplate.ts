import { BarakGL } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = BarakGL.render({}, element, 'append');
