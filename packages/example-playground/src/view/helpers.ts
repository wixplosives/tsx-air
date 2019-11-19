import { Example } from './../utils/examples.index';
import { BuiltCode } from './../utils/build.helpers';
import * as _monaco from 'monaco-editor';
import ts from 'typescript';
import { Model } from './index.model';
import { flatten, debounce } from 'lodash';
import { getSource, getCompiled } from '../utils/build';
const monaco: Promise<typeof _monaco> = new Promise(resolve => {
    // @ts-ignore
    window.require(['vs/editor/editor.api'], resolve);
});

let editor!: _monaco.editor.IStandaloneCodeEditor;
let model!: _monaco.editor.ITextModel;
export async function showSourceCode({ dom, currentExample, getSelectedSource }: Model,
    onEdit: (newSource: string) => Promise<void>) {

    onEdit = debounce(onEdit, 300);
    const path = getSelectedSource();
    const source = getSource(await currentExample.build, path);
    if (!editor) {
        (await monaco).languages.typescript.typescriptDefaults.setCompilerOptions({
            jsx: ts.JsxEmit.Preserve,
            jsxFactory: 'TSXAir',
            esModuleInterop: true
        });
        model = await createFileModel(path + '.tsx', await source);
        model.onDidChangeContent(() => onEdit(model.getValue()));
        editor = (await monaco).editor.create(dom.source, {
            model,
            readOnly: false,
            language: 'typescript',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
        });
    } else {
        model.onDidChangeContent(() => undefined);
        model.setValue('');
        model.setValue(await source);
        model.onDidChangeContent(() => onEdit(model.getValue()));
    }
}

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

export async function showCompiledCode({ dom, currentExample, getSelectedSource }: Model) {
    dom.compiled.textContent = await getCompiled(await currentExample.build, getSelectedSource());
    (await monaco).editor.colorizeElement(dom.compiled, {});
}

export async function updateSources(target: HTMLSelectElement, example: Example) {
    async function getImportsPath(build: Promise<BuiltCode> | BuiltCode): Promise<string[]> {
        build = await build;
        const imports = flatten(await Promise.all(build.imports.map(getImportsPath)));
        return [build.path, ...imports];
    }
    const sources = getImportsPath(example.build).then(
        f => f.filter(i => i.startsWith('/src/examples'))
            .map(i => ({ label: i.replace(/^\/src\//, '').replace(/\.js$/, ''), path: i })));
    return await setOptions<string>(target, sources, 'label', 'path');
}

export async function createFileModel(filePath: string, fileContents: string) {
    return (await monaco).editor.createModel(fileContents, undefined, (await monaco).Uri.parse('file://' + filePath));
}

