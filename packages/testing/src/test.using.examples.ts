import { after } from 'mocha';
import { Compiler, ExamplePaths, Features, ALL } from '@tsx-air/types';
import { loadSuite } from '@tsx-air/testing';
import { browserify } from '@tsx-air/browserify';
import { join, basename } from 'path';
import rimraf from 'rimraf';
import { preppeteer } from './html/puppeteer.mocha.utils';
import { packagePath } from '@tsx-air/utils/packages';
import { safely } from '@tsx-air/utils/src';

const fixtures = packagePath('@tsx-air/examples', 'fixtures');
const publicPath = packagePath('@tsx-air/examples', 'public');
const tempPath = packagePath('@tsx-air/examples', 'tmp');

export function shouldCompileExamples(compiler: Compiler, examplePaths: string[]) {
    const examples = examplePaths.map(loadSuite);
    describe(`${compiler.label}: compiling examples`, function () {
        const api = preppeteer({
            fixtures: [fixtures, publicPath],
            pageLoadedPredicate: () => (window as any).app
        });

        examples.map(
            ({ suite, path, features }) => {
                const exampleName = basename(path);
                const paths: ExamplePaths = {
                    temp: join(tempPath, exampleName, Date.now().toString(36)),
                    fixtures,
                    path
                };
                const unsupported = getUnsupported(features, compiler);
                if (unsupported.length) {
                    describe(exampleName, () => {
                        it.skip(`Unsupported features\n${
                            unsupported.map(f => '\t\t' + [...f.values()].join(' ')).join('\n')}`, () => {
                                /* */
                            });
                    });
                } else {
                    describe(exampleName, () => {
                        before(async () => {
                            this.timeout(process.env.CI ? 15000 : 6000);
                            this.retries(0);
                            return safely(
                                () => browserifyFiles(path, paths.temp, compiler),
                                'Failed to compile'
                            );
                        });
                        beforeEach(() => Promise.all([
                            api.server.addStaticRoot(path),
                            api.server.addStaticRoot(paths.temp),
                        ]));
                        after(function () {
                            if (this.test?.parent?.tests.every(t => t.isPassed())) {
                                // rimraf(paths.temp, () => null);
                            }
                        });

                        suite.call(this, api, paths);
                    });
                }
            });
    });
}

const getUnsupported = (features: Features, compiler: Compiler) => {
    if (compiler.features === ALL) {
        return [];
    }
    return features.filter(tested => !compiler.features.find(
        supported => {
            for (const subFeature of tested) {
                if (!supported.has(subFeature)) {
                    return false;
                }
            }
            return true;
        }
    ));
};

export const browserifyFiles = async (inputDir: string, outputDir: string,
    compiler: Compiler, entry='suite.boilerplate.ts', outputFile='boilerplate.js') => await browserify({
        base: inputDir,
        entry,
        output: join(outputDir, outputFile),
        debug: !!process.env.DEBUG,
        compiler
    });
