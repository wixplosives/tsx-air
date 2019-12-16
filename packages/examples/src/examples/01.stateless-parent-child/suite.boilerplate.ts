import { render } from '@tsx-air/framework';
import { ParentComp } from './index.source';

console.log('hello');

export default function (w: any) {
    render(w, ParentComp, { name: `Test` });
}