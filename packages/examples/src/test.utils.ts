import { Compiler, BuildTools, Loader, asJs, build, getBrowserified } from '@tsx-air/builder';
import { promisify } from 'util';
import { Page, Browser } from 'puppeteer';
import { join } from 'path';
// @ts-ignore
import webpack from 'webpack';
import nodeFs from '@file-services/node';
const readFile = promisify(nodeFs.readFile) as unknown as (path: string, options: any) => Promise<string>;

export interface ExampleSuite {
    suite: (getPage: (testTsx: string) => Promise<Page>) => Mocha.Suite;
    path: string;
}

const isSource = /\.source\.tsx?$/;

function getBuildingTools(examplePath: string): BuildTools {
    const compiler: Compiler = {
        label: 'manually compiled',
        compile: async (src, path) => {
            try {
                if (isSource.test(path)) {
                    const compiledPath = join(examplePath, path.replace(isSource, '.compiled.ts'));
                    return await readFile(compiledPath, { encoding: 'utf8' });
                }
            } catch { /* use the provided src */ }
            return src;
        }
    };

    const loader: Loader = async (path: string) => {
        path = join(examplePath, path.replace('/src/', ''));
        return readFile(`${path}.tsx`, 'utf8')
            .catch(() => readFile(`${path}.ts`, 'utf8'))
            .catch(() => readFile(`${path}.js`, 'utf8'));
    };

    return { compiler, loader };
}


type GetPage = (testHtml: string) => Promise<Page>;

export function getExampleManuallyCompiledPage(
    examplePath: string,
    browser: Browser,
    pages: Set<Page>
): GetPage {
    const { loader, compiler } = getBuildingTools(examplePath);
    return async function getPage(testBoilerplatePath: string) {
        const boilerplate = await getBrowserified(await build(compiler, loader, testBoilerplatePath), testBoilerplatePath);
        const page = await browser.newPage();
        pages.add(page);
        await page.addScriptTag({
            content: boilerplate
        });
        return page;
    };
}
