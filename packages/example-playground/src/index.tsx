import examples from './examples';
import { compilers } from './compilers';
import Prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-jsx.js';
// @ts-ignore
import 'prismjs/components/prism-tsx.js';
import 'prismjs/themes/prism.css';
import './index.css';
import { stats } from './framework';
import { evalModule } from './utils/eval-module';
// tslint:disable: no-unused-expression

document.body.innerHTML = `
<h1>Show me the samples</h1>
<div class="selection">
    <h3>Example:</h2>
    <select id="select-example">
        ${examples.map((example, i) => `<option value="${i}">${example.name}</option>`).join('\n')}
    </select>
    <h3>Compiler:</h2>
    <select id="select-compiler">
        ${compilers.map((compiler, i) => `<option value="${i}">${compiler.label}</option>`).join('\n')}
    </select>
    <h2 id="fps"></h2>
</div>
<div class="selection-follower"></div>
<section id="readme" class="readme">
</section>
<div class="example">
    <section  class="half">
        <h3>Source</h3>
        <pre>
            <code id="source" class="lang-tsx"></code>
        </pre>
    </section>

    <section  class="half">
        <h3>Style</h3>
        <pre>
            <code id="style" class="lang-css"></code>
        </pre>
    </section>
        
</div>

    <section class="half">
        <h3>Result <button id="refreshResult">🔄</button></h3>
        <div id="result" />
    </section>



    <section class="half">
        <h3>Compiled</h3>
        <pre>
            <code id="compiled" class="lang-tsx"></code>
        </pre>
    </section>
`;

let stop: () => void;
const readme = document.getElementById('readme')!;
const selectExample = document.getElementById('select-example')! as HTMLSelectElement;
const selectCompiler = document.getElementById('select-compiler')! as HTMLSelectElement;
const result = document.getElementById('result')!;
const refreshResult = document.getElementById('refreshResult')!;
const resultRoot = result.attachShadow({ mode: 'open' });
const source = document.getElementById('source')!;
const compiled = document.getElementById('compiled')!;
const style = document.getElementById('style')!;
const fps = document.getElementById('fps')!;

stats.startFpsProbe();

setInterval(() => {
    fps.innerText = 'Fps: ' + stats.getFps() || '';
    if (Math.random() < 0.0001) {
        const i = new Image();
        i.src = '/images/homer.png';
        i.classList.add('h');
        i.addEventListener('animationend', () => i.remove());
        i.onload = () => document.body.appendChild(i);
    }
}, 100);

const changeHandler = async (noScroll = false) => {
    if (stop !== undefined) { stop(); }
    localStorage.setItem('selected', selectExample.value);
    localStorage.setItem('selected-compiler', selectCompiler.value);
    noScroll || window.scrollTo(0, 0);
    const selected = examples[selectExample.value as unknown as number];
    const compiler = compilers[selectCompiler.value as unknown as number];
    readme.innerHTML = selected.readme && `<div>${selected.readme}</div>` || '';
    source.textContent = selected.source.trim();
    const output = compiler.compile(selected.source, selected.compiled);
    compiled.textContent = output.printVer;
    style.textContent = selected.style.trim();

    Prism.highlightAll();
    resultRoot.innerHTML = `<style>${selected.style}
            .result.root { display:flex; }
            </style><div class="result root"></div>`;

    const module = await evalModule(output.runVer);
    stop = module.runExample(resultRoot.querySelector('div')!);
};


selectExample.addEventListener('change', () => changeHandler());
selectCompiler.addEventListener('change', () => changeHandler(true));
refreshResult.addEventListener('click', () => changeHandler(true));

selectExample.value = localStorage.getItem('selected') || '0';
selectCompiler.value = localStorage.getItem('selected-compiler') || '0';
changeHandler();

// @ts-ignore
window.scrollTo(localStorage.getItem('scrollX'), localStorage.getItem('scrollY'));
window.addEventListener('scroll', () => {
    localStorage.setItem('scrollX', '' + window.scrollX);
    localStorage.setItem('scrollY', '' + window.scrollY);
});