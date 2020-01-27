import { clearCompiled } from './compiled';
import { clearSource } from './source';
import { monaco, ITextModel } from './monaco';
import { DOM } from './dom';
import { Model } from './index.model';
import { BuiltCode } from '../build/types';
import { Example } from '../utils/examples.index';
import flatten from 'lodash/flatten';


export async function setOptions<T>(select: HTMLSelectElement, options: Promise<any[]>, labelField?: string, valueField?: string) {
    if (!select.id) {
        throw new Error('setOptions requires select to have an id');
    }
    const ops = await options;
    select.innerHTML = `${ops.map((option: any, i) =>
        `<option value="${i}">${labelField ? option[labelField] : option}</option>`).join('\n')}`;
    select.value = localStorage.getItem(select.id) || '0';
    select.addEventListener('change', () => {
        localStorage.setItem(select.id, select.value);
    });
    return () => {
        const selected = ops[select.value as unknown as number];
        return valueField ? selected[valueField] : selected as T;
    };
}

export async function showReadme({ dom, currentExample }: Model) {
    dom.readme.innerHTML = await currentExample.readme;
}

export async function showStyle({ dom, currentExample }: Model) {
    dom.style.textContent = await currentExample.style;
    (await monaco).editor.colorizeElement(dom.style, {});
}


export async function updateSources(target: HTMLSelectElement, example: Example) {
    async function getImportsPath(build: Promise<BuiltCode> | BuiltCode): Promise<string[]> {
        build = await build;
        const imports = flatten(await Promise.all(build.imports.map(getImportsPath)));
        return [build.path, ...imports];
    }
    const sources = getImportsPath(example.build).then(
        f => f.filter(i => i.startsWith('/src/examples'))
            .map(i => ({ label: i.replace(/^\/src\/examples\/.*\//, '').replace(/\.js$/, ''), path: i }))
            .sort((a, b) => b.label.indexOf('index') - a.label.indexOf('index'))
    );
    return await setOptions<string>(target, sources, 'label', 'path');
}

export async function createFileModel(filePath: string, fileContents: string) {
    return (await monaco).editor.createModel(fileContents, undefined, (await monaco).Uri.parse('file://' + filePath));
}

export const clearModel = (model: ITextModel) => {
    if (model) {
        model.onDidChangeContent(() => void (0));
        model.setValue('');
    }
};

export function resetView(dom: DOM) {
    dom.readme.innerHTML = '';
    dom.style.innerHTML = '';
    clearSource();
    clearCompiled();
}