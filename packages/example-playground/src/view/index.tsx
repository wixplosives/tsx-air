import { compilers } from '../compilers';
import Prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-jsx.js';
// @ts-ignore
import 'prismjs/components/prism-tsx.js';
import 'prismjs/themes/prism.css';
import './index.css';
import { evalModule } from '../utils/eval-module';
import { getExamples, loadExample, Example } from '../utils/examples.index';
import dom from './dom';
import './helpers';
import { preloader } from './preloader';
import { resolve } from 'path';
import { tsLoaded } from './helpers';

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
    localStorage.setItem('selected', dom.selectExample.value);
    localStorage.setItem('selected-compiler', dom.selectCompiler.value);
    // tslint:disable-next-line: no-unused-expression
    noScroll || window.scrollTo(0, 0);

    const loaded = await loadExampleFiles(dom.selectExample.value);
    if (loaded) {
        runExample(loaded);
    }
};

const loadExampleFiles = async (example: string) => {
    const view = [dom.readme, dom.source, dom.compiled, dom.style];
    try {
        // tslint:disable-next-line: no-shadowed-variable
        const results = loadExample(example);
        const content = [results.readme, results.source, results.compiled, results.style];

        await Promise.all(
            content.map(async (l, i) => {
                try {
                    view[i].innerHTML = preloader();
                    if (l === results.readme) {
                        view[i].innerHTML = await l;
                    } else {
                        view[i].textContent = await l;
                    }
                } catch {
                    view[i].innerHTML = `<div class="error">Ooops... something went horribly wrong. we are definitely all going to die</div>`;
                }
            })
        );
        return results;
    } catch {
        return;
    }
};


const runExample = async (loaded: Example) => {
    let compiled:string;
    try {
        const compiler = compilers[dom.selectCompiler.value as unknown as number];
         compiled = compiler.compile(await loaded.source, await loaded.compiled);
        dom.compiled.textContent = compiled;
    } catch (e) {
        dom.compiled.textContent = `🤕
        ${e.message}
        🤕`;
    }
    Prism.highlightAll();

    try {
        dom.resultRoot.innerHTML = `<style>${await loaded.style}
            .result.root { display:flex; }
            </style><div class="result root"></div>`;
        const runner = await evalModule(compiled!, './source.js');
        stop = runner.runExample(dom.resultRoot.querySelector('div')!);
    } catch (e) {
        dom.resultRoot.innerHTML = `<div>🤒</div><pre>${e.message}</pre>`;
    }
};

dom.selectExample.addEventListener('change', () => changeHandler());
dom.selectCompiler.addEventListener('change', () => changeHandler(true));
dom.refreshResult.addEventListener('click', () => changeHandler(true));
