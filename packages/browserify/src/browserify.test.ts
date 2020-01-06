import { createMemoryFs } from '@file-services/memory';
import { expect } from 'chai';
import fixtures from '../fixtures';
import { browserify, browserifyPath } from './browserify';
import { join } from 'path';
import ts, { visitEachChild } from 'typescript';
import { execute } from '@tsx-air/testing';
import { exampleSrcPath } from '@tsx-air/examples';

describe('browserify', () => {
    it('should package simple.ts into a single js file', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: join(fixtures, '../tmp/bundle.js'),
            outputFs: createMemoryFs()
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });
    
    it('should use the tsconfig provided', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: join(fixtures, '../tmp/bundle.js'),
            outputFs: createMemoryFs()
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });

    it('should package with.imports.ts into a single js file', async () => {
        expect(exampleSrcPath).to.be.oneOf(
            [join(browserifyPath, '../examples/dist/src/examples'),
            join(browserifyPath, '../examples/src/examples')]);
        const built = await browserify({
            base: fixtures,
            entry: 'with.imports.ts',
            output: join(fixtures, '../tmp/bundle.js'),
            outputFs: createMemoryFs()
        });
        expect(execute(built).imports).to.eql({
            local: true,
            packageDependency: true,
            monorepoPackage: true,
            exampleSrcPath
        });
    });

    it('should transform the sources', async () => {
        const built = await browserify({
            base: fixtures,
            entry: 'simple.ts',
            output: join(fixtures, '../tmp/bundle.js'),
            outputFs: createMemoryFs(),
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