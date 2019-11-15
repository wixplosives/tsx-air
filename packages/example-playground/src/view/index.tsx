import { compilers } from '../compilers';
import Prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-jsx.js';
// @ts-ignore
import 'prismjs/components/prism-tsx.js';
import 'prismjs/themes/prism.css';
import './index.css';
import { getExamples, buildExample } from '../utils/examples.index';
import dom from './dom';
import './helpers';
import { preloader } from './preloader';
import { build } from '../utils/build';

let stop: () => void;

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
        loaded.readme.then(t => {
            dom.readme.innerHTML = t;
            Prism.highlightAll();
        });
        loaded.style.then(s => {
            dom.style.textContent = s;
            Prism.highlightAll();
        });
        loaded.build.then(({ compiled, source }) => {
            dom.compiled.textContent = compiled;
            dom.source.textContent = source;
            Prism.highlightAll();
        }).catch(async err => {
            dom.compiled.textContent = `🤕
        ${err.message}
        🤕`;
            dom.source.textContent = (await (await loaded).build).source;
        });

        try {
            dom.resultRoot.innerHTML = `
            <style>${await loaded.style}
                .result.root { display:flex; }
            </style>
            <div class="result root"></div>`;
            stop = (await (await loaded.build).module as any).runExample(dom.resultRoot.querySelector('div')!);
        } catch (err) {
            dom.resultRoot.innerHTML = `<div>🤒</div><pre>${err.message}</pre>`;
        }
    } catch (e) {
        dom.compiled.textContent = `🤕
        ${e.message}
        🤕`;
    }
};

dom.selectExample.addEventListener('change', () => changeHandler());
dom.selectCompiler.addEventListener('change', () => changeHandler(true));
dom.refreshResult.addEventListener('click', () => changeHandler(true));
