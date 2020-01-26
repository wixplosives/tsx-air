import { Example } from './../utils/examples.index';
import ts from 'typescript';
import { Model } from './index.model';
import flatten from 'lodash/flatten';
import debounce from 'lodash/debounce';
import { DOM } from './dom';
import * as view from './breakpoints';
import * as _monaco from 'monaco-editor';
import { getSource, getCompiledEsm } from '../build/build';
import { removeBreakpoint, addBreakpoint } from '../build/rebuild';
import { BuiltCode } from '../build/types';
const monaco: Promise<typeof _monaco> = new Promise(resolve => {
    // @ts-ignore
    window.require(['vs/editor/editor.api'], resolve);
});

let editor!: _monaco.editor.IStandaloneCodeEditor;
let editorModel!: _monaco.editor.ITextModel;
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
        editorModel = await createFileModel(path + '.tsx', await source);
        editorModel.onDidChangeContent(() => onEdit(editorModel.getValue()));
        editor = (await monaco).editor.create(dom.source, {
            model: editorModel,
            readOnly: false,
            language: 'typescript',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
        });
    } else {
        editorModel.onDidChangeContent(() => undefined);
        editorModel.setValue('');
        editorModel.setValue(await source);
        editorModel.onDidChangeContent(() => onEdit(editorModel.getValue()));
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

let viewer!: _monaco.editor.IStandaloneCodeEditor;
let viewerModel!: _monaco.editor.ITextModel;
export async function showCompiledCode({ dom, currentExample, getSelectedSource }: Model) {
    const path = getSelectedSource();
    const compiledCode = getCompiledEsm(await currentExample.build, path);
    if (!viewer) {
        viewerModel = await createFileModel(path, await compiledCode);
        viewer = (await monaco).editor.create(dom.compiled, {
            model: viewerModel,
            readOnly: true,
            language: 'javascript',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            contextmenu: false,
            hideCursorInOverviewRuler: true,
            glyphMargin: true,
            cursorStyle: 'line',
            cursorWidth: 0
        });
        viewer.onMouseDown(async e => {
            const { Range } = await monaco;
            const line = e.target.position!.lineNumber;
            viewer.setSelection(new Range(1, 1, 1, 1));
            if (view.hasBreakPoint(viewer, line)) {
                currentExample.build = removeBreakpoint(await currentExample.build, path, line);
                view.removeBreakPoint(viewer, line);
            } else {
                currentExample.build = addBreakpoint(await currentExample.build, path, line);
                view.addBreakPoint(viewerModel, line);
            }

        });
    } else {
        viewerModel.setValue('');
        viewerModel.setValue(await compiledCode);
    }
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

export function resetView(dom: DOM) {
    dom.readme.innerHTML = '';
    dom.style.innerHTML = '';
    if (editorModel) {
        editorModel.onDidChangeContent(() => void (0));
        editorModel.setValue('');
    }
    if (viewerModel) {
        viewerModel.onDidChangeContent(() => void (0));
        viewerModel.setValue('');
    }
}