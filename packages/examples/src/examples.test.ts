import { asTsx, asTs, isTsx, isJs, isTs } from './../../playground/src/utils/build.helpers';
import { nodeFs } from '@file-services/node';
import { launch, Page } from 'puppeteer';
import { join } from 'path';
import exp1 from './examples/01.stateless-parent-child/index.suite';
import { after } from 'mocha';
import { build, Compiler, getCompiledCjs } from '@tsx-air/playground';
import { promisify } from 'util';
const readFile = promisify(nodeFs.readFile) as unknown as (path: string, options: any) => Promise<string>;

const examples = [exp1];

const pup = launch({ headless: false, devtools: true });
export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Mocha.Suite;
    path: string;
}

const isSource = /\.source\.tsx?$/;
const compiler: Compiler = {
    label: 'manually compiled',
    compile: async (src, path) => {
        try {
            if (isSource.test(path)) {
                const compiledPath = path.replace(isSource, '.compiled.ts');
                return await readFile(compiledPath, { encoding: 'utf8' });
            }
        } catch { /* use the provided src */ }
        return src;
    }
};

const getExampleLoader = (examplePath: string) => async (path: string) => {
    path = join(examplePath, path.replace('/src/', ''));
    return readFile(path, 'utf8')
        .catch(() => readFile(`${path}.tsx`, 'utf8'))
        .catch(() => readFile(`${path}.ts`, 'utf8'))
        .catch(() => readFile(asTsx(path), 'utf8'))
        .catch(() => readFile(asTs(path), 'utf8'));
};

type GetPage = (testHtml: string) => Promise<Page>;

function getExampleManuallyCompiledPage(examplePath: string, pages: Set<Promise<Page>>): GetPage {
    const loader = getExampleLoader(examplePath);
    return async function getPage(testBoilerplatePath: string) {
        const page = (await pup).newPage();
        pages.add(page);
        const boilerplate = await build(compiler, loader, join('/src', testBoilerplatePath));
        await (await page).addScriptTag({
            content: await getCompiledCjs(boilerplate, testBoilerplatePath)
        });
        return page;
    };
}

describe('Examples: manually compiled code', () => {
    const pages = new Set<Promise<Page>>();
    afterEach(() => {
        pages.forEach(async p => {
            pages.delete(p);
            (await p).close();
        });
    });
    after(async () => (await pup).close());
    examples.map(({ suite, path }) => suite(getExampleManuallyCompiledPage(path, pages)));
});