import { Zoom } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = Zoom.render({ url: '/images/gradient.jpg' }, undefined, element, 'append');