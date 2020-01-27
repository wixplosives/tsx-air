import { render } from '@tsx-air/framework';
import { ParentComp } from './index.source';

const element = document.querySelector('div');
(window as any).app = render(element!, ParentComp, { name: `Test` });
