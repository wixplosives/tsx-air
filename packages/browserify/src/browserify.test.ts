import { expect } from 'chai';
import fixtures from '../fixtures';
import { browserify, browserifyPath } from './browserify';
import ts, { visitEachChild } from 'typescript';
import { execute } from '@tsx-air/testing';
import { exampleSrcPath } from '@tsx-air/examples';
import rimraf from 'rimraf';
import { nodeFs } from '@file-services/node';

describe('browserify', () => {
    const tmp = nodeFs.join(fixtures, '..', 'tmp');
    afterEach(done=>rimraf(tmp, done));

    it('should package simple.ts into a single js file', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: nodeFs.join(tmp, 'bundle.js')
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });

    it('should use the tsconfig provided', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: nodeFs.join(tmp, 'bundle.js')
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });

    it('should package with.imports.ts into a single js file', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'with.imports.ts',
            output: nodeFs.join(tmp, 'bundle.js')
        });
        expect(execute(built).imports).to.eql({
            local: true,
            packageDependency: true,
            monorepoPackage: true
        });
    });

    it('should package import.examples.ts into a single js file', async () => {
        expect(exampleSrcPath).to.equal(
            nodeFs.join(browserifyPath, '..', 'examples', 'src', 'examples'));
        const built = await browserify({
            base: fixtures,
            entry: 'import.examples.ts',
            configFilePath: nodeFs.join(fixtures, 'tsconfig.json'),
            output: nodeFs.join(tmp, 'bundle.js')
        });
        expect(execute(built)).to.eql({
            // TODO discuss with Avi: should be with full path
            exampleSrcPath: '/src/examples'
        });
    });

    it('should transform the sources', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: nodeFs.join(fixtures, '..', 'tmp', 'bundle.js'),
            loaderOptions: {
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
});