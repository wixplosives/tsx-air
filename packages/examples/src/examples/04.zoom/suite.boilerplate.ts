import { render } from '@tsx-air/framework';
import { Zoom } from './index.source';

const element = document.querySelector('div');
(window as any).app = render(element!, Zoom, { url: '/images/gradient.jpg' });