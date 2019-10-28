import { FileAstLoader, scan } from './scanner';

import { expect } from 'chai';
import 'mocha';

import ts from 'typescript';
import nodeFs from '@file-services/node';
import { sourceWithNotes } from './marker';
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