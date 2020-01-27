import { nodeFs } from '@file-services/node';
import { withoutExt, asTsx } from './../build/build.helpers';
import { build } from '../build/build';
import { BuiltCode } from '../build/types';
import { Compiler } from '@tsx-air/types';

export function getExamples(): Promise<string[]> {
    return globalThis.fetch('/examples').then(r => r.json());
}

export interface Example {
    name: string;
    style: Promise<string>;
    readme: Promise<string>;
    build: Promise<BuiltCode>;
}

function fetch(input: RequestInfo, init?: RequestInit | undefined): Promise<string> {
    return globalThis.fetch(input, init).then(i => i.text());
}

const loadExampleFile = (example: string, file: string) =>
    fetch(`/examples/${example}/${file}`);

const safeExampleFileLoader = async (example: string, path: string) => {
    if (path.indexOf(`/src/examples/${example}/`) !== 0) {
        throw new Error(`Invalid source path: ${path} is out of ${example} sources`);
    }
    const isSource = /\.source(\.tsx?)?$/;
    const sourcePath = withoutExt(path).replace(/^\/src/, '');
    const source = fetch(sourcePath);
    const asSrc = (file: string) => nodeFs.join('/', 'src', file).replace(/\\/g, '/');
    if (isSource.test(asTsx(sourcePath))) {
        const compiledPath = sourcePath.replace(isSource, '.compiled');
        return {
            [asSrc(compiledPath).replace(/\\/g, '/')]: await fetch(compiledPath),
            [asSrc(sourcePath).replace(/\\/g, '/')]: await source
        };
    }
    return {
        [asSrc(sourcePath).replace(/\\/g, '/')]: await source
    };
};

let convertor: import('showdown').Converter;

export const buildExample = async (example: string, compiler: Compiler) => {
    const result: Example = {
        name: example,
        style: loadExampleFile(example, 'style.css'),
        readme: loadExampleFile(example, 'readme.md')
            .then(async i => {
                convertor = convertor || new (await import('showdown')).Converter();
                return convertor.makeHtml(i);
            })
            .then(i => `<div>${i}</div>`),
        build: build(compiler, async (path: string) =>
            safeExampleFileLoader(example, path), `/src/examples/${example}/runner`)
    };
    return result;
};
