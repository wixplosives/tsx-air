import { render } from '@tsx-air/framework';
import { ParentComp } from './index.source';

export default function (window:any) {
    render(window.document.body, ParentComp, { name: `Test` });
    console.log('hello');
}