import { createMemoryFs } from '@file-services/memory';
import { expect } from 'chai';
import { browserify as base } from '../fixtures';
import { browserify } from './browserify';
import { join } from 'path';
import ts, { visitEachChild } from 'typescript';
import { execute } from '@tsx-air/testing';

describe('browserify', () => {
    it('should package simple.ts into a single js file', async () => {
        const built = await browserify({
            base,
            entry: 'simple.ts',
            output: join(__dirname, '../tmp/bundle.js'),
            outputFs: createMemoryFs()
        });
        expect(execute(built)).to.eql({ wasExported: true });
    });

    it('should package with.imports.ts into a single js file', async () => {
        const built = await browserify({
            base,
            entry: 'with.imports.ts',
            output: join(__dirname, '../tmp/bundle.js'),
            outputFs: createMemoryFs()
        });
        expect(execute(built).imports).to.eql({
            local: true,
            packageDependency: true,
            monorepoPackage: true
        });
    });

    it('should transform the sources', async () => {
        const built = await browserify({
            base,
            entry: 'simple.ts',
            output: join(__dirname, '../tmp/bundle.js'),
            outputFs: createMemoryFs(),
            loaderOptions: {
                // NOTE: if cached, will not be re-transpiled!
                cache: false,
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