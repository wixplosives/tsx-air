import { FileScanner } from './scanner';

import { expect } from 'chai';
import 'mocha';
import { fail } from 'assert';
import ts from 'typescript';
import nodeFs from '@file-services/node';

describe(`Scanner,.scan, Given a valid tsx file and file system`, () => {
    const samplePath = 'test/resources/scanner/sample.tsx';
    const fs = nodeFs;
    const scanner = new FileScanner(fs, samplePath);

    it('should run visitor on every node of the AST once', () => {
        const visited = [] as ts.Node[];
        scanner.scan(samplePath, node => {
            if (visited.find(i => i === node)) {
                fail('A node was visited more than once');
            }
            visited.push(node);
        });
        expect(visited).to.have.length(13, 'some nodes were not visited');
    });

    it('should return the points of interest, as returned from the visitor', () => {
        const result = scanner.scan(samplePath, node => node.kind === ts.SyntaxKind.VariableDeclaration ? 'Var!' : undefined);
        expect(result).to.have.length(2);
        expect(result[0]).to.haveOwnProperty('node');
        expect(result[0]).to.haveOwnProperty('note');
    });

    it('should update FileScanner source after scanning', () => {
        scanner.scan(samplePath, node => node.kind === ts.SyntaxKind.VariableDeclaration ? 'Var!' : undefined);
        expect(scanner.source).to.equal(`const a=1;
export const b=a;`);
    });
});
