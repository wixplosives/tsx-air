import { FileScanner } from './scanner';

import { expect } from 'chai';
import 'mocha';

import ts from 'typescript';
import nodeFs from '@file-services/node';
import { sourceWithNotes } from './marker';

describe('sourceWithNotes', () => {
    const samplePath = 'test/resources/scanner/sample.tsx';
    const fs = nodeFs;
    const scanner = new FileScanner(fs, samplePath);
    const source = nodeFs.readFileSync(samplePath).toString('utf8');
    let counter = 1;

    it('should insert notes into the original source', () => {
        const notes = scanner.scan(samplePath, node => node.kind === ts.SyntaxKind.VariableDeclaration ? `/* Var ${counter++} */ ` : undefined);

        expect(sourceWithNotes(source, notes)).to.equal(
            `const /* Var 1 */ a=1;
export const /* Var 2 */ b=a;`);
    });
});