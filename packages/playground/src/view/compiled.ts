
import { getCompiledEsm } from '../build/build';
import { createFileModel, clearModel } from './helpers';
import { IStandaloneCodeEditor, ITextModel, monaco } from './monaco';
import { removeBreakpoint, addBreakpoint } from '../build/rebuild';
import * as view from './breakpoints';
import { Model } from './index.model';

let viewer!: IStandaloneCodeEditor;
let compiledModel!: ITextModel;
export async function showCompiledCode({ dom, currentExample, getSelectedSource }: Model) {
    const path = getSelectedSource();
    const compiledCode = getCompiledEsm(await currentExample.build, path);
    if (!viewer) {
        compiledModel = await createFileModel(path + '.js', await compiledCode);
        viewer = (await monaco).editor.create(dom.compiled, {
            model: compiledModel,
            readOnly: true,
            language: 'javascript',
            colorDecorators: true,
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
                view.addBreakPoint(compiledModel, line);
            }

        });
    } else {
        compiledModel.setValue('');
        compiledModel.setValue(await compiledCode);
    }
}

export const clearCompiled = () => clearModel(compiledModel);

