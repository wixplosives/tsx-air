import { compilers } from '../compilers';
import './index.css';
import { getExamples, buildExample } from '../utils/examples.index';
import dom from './dom';
import './helpers';
import { showStyle, setOptions, updateSources, showReadme, resetView } from './helpers';
import { Model } from './index.model';
import { setup } from './setup';
import { rebuild, reCompile } from '../build/rebuild';
import { Compiler } from '@tsx-air/types';
import { showCompiledCode } from './compiled';
import { showSourceCode } from './source';
setup();

(async () => {
    const getSelectedExample = await setOptions<string>(dom.selectExample, getExamples());
    const getSelectedCompiler = await setOptions<Compiler>(dom.selectCompiler, Promise.resolve(compilers), 'label');
    const currentExample = await buildExample(getSelectedExample(), getSelectedCompiler());

    const model: Model = {
        stop: () => void (0),
        dom,
        currentExample,
        getSelectedExample,
        getSelectedCompiler,
        getSelectedSource: await updateSources(dom.selectSource, currentExample)
    };

    setExample(model);

    dom.selectExample.addEventListener('change', () => {
        setExample(model);
        localStorage.removeItem(model.dom.selectSource.id);
    });
    dom.selectCompiler.addEventListener('change', () => setCompiler(model));
    dom.refreshResult.addEventListener('click', () => {
        model.stop();
        runExample(model);
    });
    dom.selectSource.addEventListener('change', () => {
        showCompiledCode(model);
        showSourceCode(model, rebuildSource(model));
    });
})();

function rebuildSource(model: Model) {
    return async function _rebuildSource(newSource: string) {
        model.stop();
        model.currentExample.build = rebuild(await model.currentExample.build, {
            [model.getSelectedSource()]: newSource
        });
        showCompiledCode(model);
        runExample(model);
    };
}

async function setExample(model: Model) {
    model.stop();
    resetView(model.dom);
    model.currentExample = await buildExample(model.getSelectedExample(), model.getSelectedCompiler());
    showStyle(model);
    showReadme(model);
    model.getSelectedSource = await updateSources(model.dom.selectSource, model.currentExample);
    showCompiledCode(model);
    showSourceCode(model, rebuildSource(model));
    runExample(model);
}

async function setCompiler(model: Model) {
    model.stop();
    localStorage.removeItem(model.dom.selectSource.id);
    model.currentExample.build = reCompile(await model.currentExample.build, model.getSelectedCompiler());
    model.getSelectedSource = await updateSources(model.dom.selectSource, model.currentExample);
    showCompiledCode(model);
    runExample(model);
}

async function runExample(model: Model) {
    await (await model.currentExample.build).module;
    try {
        model.dom.resultRoot.innerHTML = `
            <style>${await model.currentExample.style}
                .result.root { display:flex; }
            </style>
            <div class="result root"></div>`;
        model.stop = (await (await model.currentExample.build).module as any).runExample(dom.resultRoot.querySelector('div')!);
        model.stop = model.stop || (() => void (0));
    } catch (err) {
        model.dom.resultRoot.innerHTML = `<div>🤒</div><pre>${err.message}</pre>`;
        throw err;
    }
}
