import { FactoryWrapper } from './index.source';

const element = document.querySelector('div')!;
(window as any).app = FactoryWrapper.render({ lastName:'Last' }, element, 'append');