import { render } from '@tsx-air/framework';
import { ParentComp } from './index.source';

const element = document.querySelector('div');
const app = render(element!, ParentComp, { name: `Test` });
