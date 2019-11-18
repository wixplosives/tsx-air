import { IFileSystem } from '@file-services/types';
import { compilers } from './../compilers';
import dom from './dom';
import { stats } from '../framework';
import * as _monaco from 'monaco-editor';
import ts from 'typescript';
let monaco: typeof _monaco;
// @ts-ignore
window.require(['vs/editor/editor.api'], (m: typeof _monaco) => { monaco = m; });


// @ts-ignore
window.scrollTo(localStorage.getItem('scrollX'), localStorage.getItem('scrollY'));
window.addEventListener('scroll', () => {
    localStorage.setItem('scrollX', '' + window.scrollX);
    localStorage.setItem('scrollY', '' + window.scrollY);
});


stats.startFpsProbe();

setInterval(() => {
    dom.fps.innerText = 'Fps: ' + stats.getFps() || '';
    if (Math.random() < 0.0001) {
        const i = new Image();
        i.src = '/images/homer.png';
        i.classList.add('h');
        i.addEventListener('animationend', () => i.remove());
        i.onload = () => document.body.appendChild(i);
    }
}, 100);

dom.selectCompiler.innerHTML = `${compilers.map((compiler, i) =>
    `<option value="${i}">${compiler.label}</option>`).join('\n')}`;
dom.selectCompiler.value = localStorage.getItem('selected-compiler') || '0';

export function showCode(path:string, compiled: string, source: string) {
    dom.compiled.textContent = compiled;
    monaco.editor.colorizeElement(dom.compiled, {});

    const model = createFileModel(path.replace(/\.js$/,'.tsx'), source);
    dom.source.innerHTML = '';
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: ts.JsxEmit.Preserve,
        jsxFactory: 'TSXAir',
        esModuleInterop: true
    });
    // monaco.languages.registerDefinitionProvider('typescript', {
    //     provideDefinition: (mdl, pos, token) => {
    //         console.log(mdl, pos, token);
    //         const filePath='/src/examples/ex1/com.ts';
    //         return {
    //             uri: monaco.Uri.parse('file://' + filePath),
    //             range: monaco.Range.fromPositions({lineNumber:1, column:1})
    //         };
    //     }
    // });
    const editor = monaco.editor.create(dom.source, {
        model,
        readOnly: false,
        language: 'typescript',
        lineNumbers: 'off',
        roundedSelection: false,
        scrollBeyondLastLine: false,
    });
    // editor.onDidChangeModelContent(event => {
    //     console.log(event);
    // });

}

export function showStyle(style: string) {
    dom.style.textContent = style;
    monaco.editor.colorizeElement(dom.style, {});
}

export function createFileModel(filePath: string, fileContents: string) {
    return monaco.editor.createModel(fileContents, undefined, monaco.Uri.parse('file://' + filePath));
}

function* recursiveFileList(fs: IFileSystem, startPath: string): IterableIterator<string> {
    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const fullPath = fs.join(startPath, file);
        if (fs.directoryExistsSync(fullPath)) {
            yield* recursiveFileList(fs, fullPath);
        } else {
            yield fullPath;
        }
    }
}

export function registerTypeDefinitions(fs: IFileSystem) {
    for (const filePath of recursiveFileList(fs, '/')) {
        if (filePath.endsWith('.d.ts')) {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                fs.readFileSync(filePath, 'utf8'),
                'file://' + filePath
            );
        }
    }
}
