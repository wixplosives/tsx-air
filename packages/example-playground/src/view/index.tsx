import { compilers } from '../compilers';
import Prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-jsx.js';
// @ts-ignore
import 'prismjs/components/prism-tsx.js';
import 'prismjs/themes/prism.css';
import './index.css';
import { getExamples, buildExample, Example } from '../utils/examples.index';
import dom from './dom';
import './helpers';
import { preloader } from './preloader';

let stop: () => void;
let current!: Example;

getExamples().then((examples: string[]) => {
    dom.selectExample.innerHTML =
        `${examples.map(example => `<option value="${example}">${example}</option>`)
            .join('\n')}`;
    dom.selectExample.value = localStorage.getItem('selected') || examples[0];
    changeHandler();
});


const changeHandler = async (noScroll = false) => {
    if (stop !== undefined) { stop(); }
    dom.style.innerHTML = dom.source.innerHTML = dom.compiled.innerHTML = dom.readme.innerHTML = dom.resultRoot.innerHTML = preloader();

    localStorage.setItem('selected', dom.selectExample.value);
    localStorage.setItem('selected-compiler', dom.selectCompiler.value);
    // tslint:disable-next-line: no-unused-expression
    noScroll || window.scrollTo(0, 0);

    const compiler = compilers[dom.selectCompiler.value as unknown as number];
    try {
        const loaded = await buildExample(dom.selectExample.value, compiler);
        current = loaded;
        loaded.readme.then(t => {
            dom.readme.innerHTML = t;
            Prism.highlightAll();
        });
        loaded.style.then(s => {
            dom.style.textContent = s;
            Prism.highlightAll();
        });
        loaded.build.then(async ({ compiled, source }) => {
            dom.compiled.textContent = compiled;
            dom.source.textContent = source;
            Prism.highlightAll();
            let imports = '';
            for (const imprt of [loaded.build, ...((await loaded.build).imports)]) {
                const src = await imprt;
                imports = `${imports}<option value="${src.path}">${src.path.replace('/src/', '')}</option>`;
            }
            dom.compiledImports.innerHTML = imports;
        }).catch(async err => {
            dom.compiled.textContent = `🤕
        ${err.message}
        🤕`;
            dom.source.textContent = (await (await loaded).build).source;
        });

        runExample();
    } catch (e) {
        dom.compiled.textContent = `🤕
        ${e.message}
        🤕`;
    }
};

async function runExample() {
    try {
        if (stop !== undefined) { stop(); }
        dom.resultRoot.innerHTML = `
            <style>${await current.style}
                .result.root { display:flex; }
            </style>
            <div class="result root"></div>`;
        stop = (await (await current.build).module as any).runExample(dom.resultRoot.querySelector('div')!);
    } catch (err) {
        dom.resultRoot.innerHTML = `<div>🤒</div><pre>${err.message}</pre>`;
    }
}

dom.selectExample.addEventListener('change', () => changeHandler());
dom.selectCompiler.addEventListener('change', () => changeHandler(true));
dom.refreshResult.addEventListener('click', runExample);
dom.compiledImports.addEventListener('change', async () => {
    dom.compiled.textContent = '';
    dom.source.textContent = '';
    const src = dom.compiledImports.value;
    for (const imprt of [current.build, ...((await current.build).imports)]) {
        const { path, compiled, source } = await imprt;
        if (path === src) {
            dom.compiled.textContent = compiled;
            dom.source.textContent = source;
        }
    }
    Prism.highlightAll();
});