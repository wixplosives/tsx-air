import { expect } from 'chai';
import fixtures from '../fixtures';
import { browserify } from './browserify';
import ts, { visitEachChild } from 'typescript';
import { execute, createMockpiler } from '@tsx-air/testing';
import rimraf from 'rimraf';
import { nodeFs } from '@file-services/node';
import { packagePath } from '@tsx-air/utils/packages';

describe('browserify', () => {
    let tmp: string;

    it('should package simple.ts into a single js file', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: nodeFs.join(tmp, 'bundle.js'),
            compiler: createMockpiler()
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });

    it('should use the tsconfig provided', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: nodeFs.join(tmp, 'bundle.js'),
            compiler: createMockpiler()
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });

    it('should package with.imports.ts into a single js file', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'with.imports.ts',
            output: nodeFs.join(tmp, 'bundle.js'),
            compiler: createMockpiler()
        });
        expect(execute(built).imports).to.eql({
            localImport: true,
            importedTsx: true,
            packageDependency: true,
            monorepoPackage: true
        });
    });

    it('copies all .compiled files to the target folder', async () => {
        await browserify({
            base: fixtures,
            entry: 'with.imports.ts',
            output: nodeFs.join(tmp, 'bundle.js'),
            compiler: createMockpiler()
        });
        expect(nodeFs.existsSync(nodeFs.join(tmp, 'src.js', 'something.compiled.ts'))).to.equal(true);
    });

    it('should package import.examples.ts into a single js file', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'import.examples.ts',
            configFilePath: nodeFs.join(fixtures, 'tsconfig.json'),
            output: nodeFs.join(tmp, 'bundle.js'),
            compiler: createMockpiler()
        });
        expect(execute(built)).to.eql({
            // TODO discuss with Avi: should be with full path
            exampleSrcPath: '/'
        });
    });

    it('should transform the sources', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: nodeFs.join(fixtures, '..', 'tmp', 'bundle.js'),
            compiler: {
                label: 'transformer',
                features: [],
                transformers: {
                    before: [ctx => node => {
                        const visitor: ts.Visitor = (n: ts.Node) => {
                            if (ts.isIdentifier(n) && n.text === 'wasExported') {
                                return ts.createIdentifier('wasTransformed');
                            }
                            return visitEachChild(n, visitor, ctx);
                        };
                        return visitEachChild(node, visitor, ctx);
                    }]
                }
            }
        });
        expect(execute(built)).to.eql({ wasTransformed: true });
    });


    beforeEach(function () {
        tmp = packagePath('@tsx-air/browserify', 'tmp', this.currentTest!.title);
    });
    afterEach(function (done) {
        this.test?.isPassed() ? rimraf(tmp, done) : done();
    });
});