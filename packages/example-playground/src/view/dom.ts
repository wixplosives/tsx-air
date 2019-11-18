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
    compiledImports: imports,
};