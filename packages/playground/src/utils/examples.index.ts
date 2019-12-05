import { build } from './build';
import { Compiler } from '../compilers';
import { BuiltCode } from './build.helpers';

export async function getExamples(): Promise<string[]> {
    return (await (await fetch('/examples')).json());
}

export interface Example {
    name: string;
    style: Promise<string>;
    readme: Promise<string>;
    build: Promise<BuiltCode>;
}

export type Loader = (path: string) => Promise<string>;

const loadExampleFile = async (example: string, file: string) =>
    await (await fetch(`/examples/${example}/${file}`)).text();

const safeExampleFileLoader = async (example: string, path: string) => {
    if (path.indexOf(`/src/examples/${example}/`) !== 0) {
        throw new Error(`Invalid source path: ${path} is out of ${example} sources`);
    }
    const exampleFilePath = path.replace(/^\/src/, '').replace(/\.js$/, '');
    return await (await fetch(exampleFilePath)).text();
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
        build: build(compiler, async path => safeExampleFileLoader(example, path), `/src/examples/${example}/source`)
    };
    return result;
};
