import { ExamplePaths } from './../../types/src/examples';
import { after } from 'mocha';
import { Compiler } from '@tsx-air/types';
import { loadSuite } from '@tsx-air/testing';
import ts from 'typescript';
import { browserify } from '@tsx-air/browserify';
import { join, basename, dirname } from 'path';
import rimraf from 'rimraf';
import { preppeteer } from './html/puppeteer.mocha.utils';
const examplePackage = dirname(require.resolve('@tsx-air/examples/package.json'));
const fixtures = join(examplePackage, 'fixtures');
const publicPath = join(examplePackage, 'public');
const tempPath = join(__dirname, '../.tmp');

export function shouldCompileExamples(compiler: Compiler, examplePaths: string[]) {
    const examples = examplePaths.map(loadSuite);    
    describe(`${compiler.label}: compiling examples`, function () {
        const api = preppeteer({
            fixtures: [fixtures, publicPath],
            pageLoadedPredicate: () => (window as any).app
        });

        examples.map(
            ({ suite, path }) => {
                const exampleName = basename(path);
                const paths:ExamplePaths = {
                    temp: join(tempPath, exampleName, Date.now().toString(36)),
                    fixtures,
                    path
                };

                describe(exampleName, () => {
                    before(() => {
                        this.timeout(process.env.CI ? 15000 : 6000);
                        return browserifyBoilerplate(path, paths.temp, compiler.transformers);
                    });
                    beforeEach(() => Promise.all([
                        api.server.addStaticRoot(path),
                        api.server.addStaticRoot(paths.temp),
                    ]));
                    after(() => rimraf(paths.temp, () => void (0)));

                    suite.call(this, api, paths);
                });
            });
    });
}

const browserifyBoilerplate = async (examplePath: string, target: string,
    transformers: ts.CustomTransformers) => await browserify({
        base: examplePath,
        entry: 'suite.boilerplate.ts',
        output: join(target, 'boilerplate.js'),
        debug: !!process.env.DEBUG,
        loaderOptions: {
            transformers,
            cache: false
        }
    });
