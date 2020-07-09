import { Thumb } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = Thumb.render({ url: '/images/pretty-boy.jpg' }, element, 'append');
