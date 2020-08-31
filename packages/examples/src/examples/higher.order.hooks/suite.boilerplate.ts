import { Gallery } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = Gallery.render({ baseUrl: 'images' }, element, 'append');