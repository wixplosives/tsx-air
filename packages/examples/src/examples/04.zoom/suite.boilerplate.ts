import { render } from '@tsx-air/framework';
import { Zoom } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = render(Zoom, { url: '/images/gradient.jpg' }, undefined, element, 'append');