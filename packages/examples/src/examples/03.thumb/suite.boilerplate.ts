import { render } from '@tsx-air/framework';
import { Thumb } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = render(Thumb, { url: '/images/pretty-boy.jpg' }, undefined, element, 'append');
