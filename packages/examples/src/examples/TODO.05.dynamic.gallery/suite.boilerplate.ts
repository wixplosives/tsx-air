import { render } from '@tsx-air/framework';
import { Gallery } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = render(Gallery, {}, undefined, element, 'append');
export { Gallery as Mousy };