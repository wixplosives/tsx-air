import ts from 'typescript';
import { Model } from './index.model';
import debounce from 'lodash/debounce';
import { getSource } from '../build/build';
import { createFileModel, clearModel } from './helpers';
import { IStandaloneCodeEditor, ITextModel, monaco } from './monaco';

let editor!: IStandaloneCodeEditor;
let editorModel!: ITextModel;
export async function showSourceCode({ dom, currentExample, getSelectedSource }: Model,
    onEdit: (newSource: string) => Promise<void>) {
    onEdit = debounce(onEdit, 300) as any;
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

export const clearSource = () => clearModel(editorModel);