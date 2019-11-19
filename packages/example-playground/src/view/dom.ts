const readme = document.getElementById('readme')!;
const selectExample = document.getElementById('select-example')! as HTMLSelectElement;
const selectCompiler = document.getElementById('select-compiler')! as HTMLSelectElement;
const result = document.getElementById('result')!;
const refreshResult = document.getElementById('refreshResult')!;
const resultRoot = result.attachShadow({ mode: 'open' });
const source = document.getElementById('source')!;
const compiled = document.getElementById('compiled')!;
const style = document.getElementById('style')!;
const fps = document.getElementById('fps')!;
const imports = document.getElementById('compiled-imports')! as HTMLSelectElement;

export interface DOM {
    selectExample: HTMLSelectElement;
    selectCompiler: HTMLSelectElement;
    selectSource: HTMLSelectElement;
    readme: HTMLElement;
    result: HTMLElement;
    refreshResult: HTMLElement;
    resultRoot: ShadowRoot;
    source: HTMLElement;
    compiled: HTMLElement;
    style: HTMLElement;
    fps: HTMLElement;
}

export default {
    readme,
    selectExample,
    selectCompiler,
    result,
    refreshResult,
    resultRoot,
    source,
    compiled,
    style,
    fps,
    selectSource: imports,
} as DOM;
