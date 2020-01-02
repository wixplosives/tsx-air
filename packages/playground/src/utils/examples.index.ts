import { withoutExt } from './../build/build.helpers';
import { build } from '../build/build';
import { BuiltCode } from '../build/types';
import { Compiler } from '@tsx-air/compilers';

export async function getExamples(): Promise<string[]> {
    return (await (await fetch('/examples')).json());
}

export interface Example {
    name: string;
    style: Promise<string>;
    readme: Promise<string>;
    build: Promise<BuiltCode>;
}

const loadExampleFile = async (example: string, file: string) =>
    await (await fetch(`/examples/${example}/${file}`)).text();

const safeExampleFileLoader = async (example: string, path: string) => {
    if (path.indexOf(`/src/examples/${example}/`) !== 0) {
        throw new Error(`Invalid source path: ${path} is out of ${example} sources`);
    }
    const isSource = /\.source\.tsx?$/;
    const sourcePath = withoutExt(path).replace(/^\/src/, '');
    const source = fetch(sourcePath).then(i => i.text());
    if (isSource.test(sourcePath)) {
        const compiledPath = (await source).replace(isSource, '.compiled');
        return {
            [compiledPath]: await fetch(compiledPath).then(i => i.text()),
            [sourcePath]: await source
        };
    }
    return {
        [sourcePath]: await source
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
        build: build(compiler, async (path:string) => 
            safeExampleFileLoader(example, path), `/src/examples/${example}/runner`)
    };
    return result;
};
