import { render } from '@tsx-air/framework';
import { ParentComp } from './index.source';

export default function (w:Window) {
    render(w.document.body, ParentComp, { name: `Test` });
}