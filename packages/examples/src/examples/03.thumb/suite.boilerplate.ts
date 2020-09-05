import { Thumb } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = Thumb.render({ imageId: 'pretty-boy', resolution:'high' }, element, 'append');
