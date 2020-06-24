import { render } from '@tsx-air/framework';
import { Mousy } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = render(Mousy, {}, undefined, element, 'append');
export { Mousy };