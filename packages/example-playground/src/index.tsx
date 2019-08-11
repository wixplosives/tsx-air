import examples, { Example } from './examples';
import Prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-jsx.js';
// @ts-ignore
import 'prismjs/components/prism-tsx.js';
import 'prismjs/themes/prism.css';
import './index.css';

document.body.innerHTML = `
<h1>Show me the samples</h1>
<div class="selection">
    <select>
        <option>Select an example</option>
        ${examples.map((example, i) => `<option value="${i}">${example.name}</option>`).join('\n')}
    </select>
</div>
<div class="example">
    <section>
        <h3>Source</h3>
        <pre>
        <code id="source" class="lang-tsx"></code>
        </pre>
    </section>

    <section>
        <h3>Compiled</h3>
        <pre>
        <code id="compiled" class="lang-tsx"></code>
        </pre>
    </section>

    <section>
        <h3>Result</h3>
        <div id="result" />
    </section>
</div>
`;

let selected: Example;
const select = document.querySelector('select')!;
const result = document.getElementById('result')!;
const source = document.getElementById('source')!;
const compiled = document.getElementById('compiled')!;

// @ts-ignore
const selectExample = () => {
    selected = examples[select.value as unknown as number];
    source.textContent = selected.source;
    compiled.textContent = selected.compiled;
    // tslint:disable-next-line: no-console
    Prism.highlightAll();
    selected.run(result);
};
select.addEventListener('change', selectExample);
