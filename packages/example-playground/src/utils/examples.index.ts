import { Converter } from 'showdown';

export const getExamples = async () =>
    (await (await fetch('/examples')).json());

export interface Example {
    name: string;
    source: Promise<string>;
    compiled: Promise<string>;
    style: Promise<string>;
    readme: Promise<string>;
}

const loadExampleFile = async (example: string, file: string) =>
    await (await fetch(`/examples/${example}/${file}`)).text();
const convertor = new Converter();

export const loadExample = (example: string) => {
    const result: Example = {
        name: example,
        source: loadExampleFile(example, 'source.tsx'),
        compiled: loadExampleFile(example, 'compiled.ts'),
        style: loadExampleFile(example, 'style.css'),
        readme: loadExampleFile(example, 'readme.md')
            .then(i => convertor.makeHtml(i))
            .then(i=>`<div>${i}</div>`)
    };
    return result;
};
