import { FileAstLoader, scan } from './scanner';

import { expect } from 'chai';
import 'mocha';

import ts from 'typescript';
import nodeFs from '@file-services/node';
import { sourceWithNotes, transpileNode } from './marker';
import { normalizeLineBreaks } from './test.helpers';

describe('sourceWithNotes', () => {
    const samplePath = require.resolve('../../test/resources/scanner/sample.tsx');
    const fs = nodeFs;
    const scanner = new FileAstLoader(fs, samplePath);
    const { ast, source } = scanner.getAst(samplePath);

    it('should insert notes into the original source', () => {
        let counter = 1;
        const notes = scan(ast, node => node.kind === ts.SyntaxKind.VariableDeclaration ? `/* Var ${counter++} */ ` : undefined);

        expect(normalizeLineBreaks(sourceWithNotes(source, notes))).to.equal(
            `const /* Var 1 */ a=1;
export const /* Var 2 */ b=a;`);
    });

    it('should insert object notes as a string comment into the original source', () => {
        let counter = 1;
        const notes = scan(ast, node => node.kind === ts.SyntaxKind.VariableDeclaration ? ({ 'Var': counter++ }) : undefined);

        expect(normalizeLineBreaks(sourceWithNotes(source, notes))).to.equal(
            `const /* {"Var":1} */ a=1;
export const /* {"Var":2} */ b=a;`);
    });
});



describe('replaceNodeText', () => {
    const samplePath = require.resolve('../../test/resources/scanner/sample.tsx');
    const fs = nodeFs;
    const scanner = new FileAstLoader(fs, samplePath);
    const { ast } = scanner.getAst(samplePath);

    it('should replace nodes with new text', () => {
        const notes = scan(ast, node => node.kind === ts.SyntaxKind.VariableDeclaration ? {
            name: (node as ts.VariableDeclaration).name.getText()
        } : undefined);

        expect(transpileNode(ast, notes, p => `recombabulated_${p.metadata.name} = 'gaga'`).replace(/\r\n/g, '\n')).to.equal(
            `const recombabulated_a = 'gaga';
export const recombabulated_b = 'gaga';`);
    });
    it('should replace nested nodes', () => {
        const { ast: testAst } = scanner.getAst(samplePath, `
            const a = {
                b: {
                    c: {

                    }
                }
            };
        `);
        const notes = scan(testAst, node => node.kind === ts.SyntaxKind.ObjectLiteralExpression ? {
            kind: 'objectLiteral'
        } : undefined);

        expect(transpileNode(testAst, notes, _p => `'gaga'`).replace(/\r\n/g, '\n')).to.equal(
            `const a = 'gaga'`);
    });
});