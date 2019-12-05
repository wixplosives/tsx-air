import _monaco from 'monaco-editor';
const monaco: Promise<typeof _monaco> = new Promise(resolve => {
    // @ts-ignore
    window.require(['vs/editor/editor.api'], resolve);
});

// Add a breakpoint
export async function addBreakPoint(model: _monaco.editor.ITextModel, line: number) {
    const {Range} = await monaco;
    const value = { range: new Range(line, 1, line, 1), options: { isWholeLine: true, linesDecorationsClassName: 'breakpoints' } };
    model.deltaDecorations([], [value]);
}

// Delete the breakpoint, if the line is specified, delete the breakpoint of the specified line, otherwise delete all breakpoints in the current model
export async function removeBreakPoint(editor: _monaco.editor.IStandaloneCodeEditor, line: number) {
    const model = editor.getModel()!;
    const decorations = editor.getLineDecorations(line)!;
    const ids = [];
    for (const decoration of decorations) {
        if (decoration.options.linesDecorationsClassName === 'breakpoints') {
            ids.push(decoration.id);
        }
    }
    if (ids && ids.length) {
        model.deltaDecorations(ids, []);
    }
}

// Determine whether the line has a breakpoint
export function hasBreakPoint(editor:_monaco.editor.IStandaloneCodeEditor, line: number) {
    const decorations = editor.getLineDecorations(line)!;
    for (const decoration of decorations) {
        if (decoration.options.linesDecorationsClassName === 'breakpoints') {
            return true;
        }
    }
    return false;
}
