import { render } from '@tsx-air/framework';
import { StatefulComp } from './index.source';

const element = document.querySelector('div');
(window as any).app = render(element!, StatefulComp, { initialState: 'button' });
