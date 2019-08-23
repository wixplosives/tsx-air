import examples from './examples';
import Prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-jsx.js';
// @ts-ignore
import 'prismjs/components/prism-tsx.js';
import 'prismjs/themes/prism.css';
import './index.css';
import {stats} from './framework';

document.body.innerHTML = `
<h1>Show me the samples</h1>
<div class="selection">
    <select>
        ${examples.map((example, i) => `<option value="${i}">${example.name}</option>`).join('\n')}
    </select>
    <h2 id="fps"></h2>
</div>
<div class="selection-follower"></div>
<div class="example">
    <section class="result">
        <h3>Result</h3>
        <div id="result" />
    </section>

    <section>
        <h3>Source</h3>
        <pre>
        <code id="source" class="lang-tsx"></code>
        </pre>
    </section>

     <section>
        <h3>Style</h3>
        <pre>
        <code id="style" class="lang-css"></code>
        </pre>
    </section>

    <section>
        <h3>Compiled</h3>
        <pre>
        <code id="compiled" class="lang-tsx"></code>
        </pre>
    </section>
</div>
`;

let stop: () => void;
const select = document.querySelector('select')!;
const result = document.getElementById('result')!;
const resultRoot = result.attachShadow({ mode: 'open' });
const source = document.getElementById('source')!;
const compiled = document.getElementById('compiled')!;
const style = document.getElementById('style')!;
const fps = document.getElementById('fps')!;

stats.startFpsProbe();

setInterval(() => fps.innerText = '' + stats.getFps() || '');

const selectExample = () => {
    if (stop !== undefined) { stop(); }
    localStorage.setItem('selected', select.value);
    const selectedIndex = select.value as unknown as number;
    if (isNaN(selectedIndex)) {
        source.textContent = '';
        compiled.textContent = '';
        style.textContent = '';
        resultRoot.innerHTML = '<div></div>';
    } else {
        const selected = examples[select.value as unknown as number];
        source.textContent = selected.source.trim();
        compiled.textContent = selected.compiled.trim();
        style.textContent = selected.style.trim();
        Prism.highlightAll();
        resultRoot.innerHTML = `<style>${selected.style}
            .result.root { display:flex; }
            </style><div class="result root"></div>`;
        stop = selected.run(resultRoot.querySelector('div')!);
    }
};
select.addEventListener('change', selectExample);

select.value = localStorage.getItem('selected') || '0';
selectExample();

// @ts-ignore
window.scrollTo(localStorage.getItem('scrollX'), localStorage.getItem('scrollY'));
window.addEventListener('scroll', () => {
    localStorage.setItem('scrollX', '' + window.scrollX);
    localStorage.setItem('scrollY', '' + window.scrollY);
});