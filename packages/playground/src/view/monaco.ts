import * as _monaco from 'monaco-editor';
export const monaco: Promise<typeof _monaco> = new Promise(resolve => {
    // @ts-ignore
    window.require(['vs/editor/editor.api'], resolve);
});

export type IStandaloneCodeEditor = _monaco.editor.IStandaloneCodeEditor;
export type ITextModel = _monaco.editor.ITextModel;