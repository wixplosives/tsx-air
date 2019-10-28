import { FileAstLoader, scan, find } from './scanner';
import { expect } from 'chai';
import 'mocha';
import { fail } from 'assert';
import ts from 'typescript';
import nodeFs from '@file-services/node';
import { normalizeLineBreaks } from './test.helpers';

describe('FileAstLoader', () => {
    const samplePath = require.resolve('../../test/resources/scanner/sample.tsx');
    const fs = nodeFs;
    const scanner = new FileAstLoader(fs, samplePath);


    it('should load a file as an AST and raw source', () => {
        const { ast, source } = scanner.getAst(samplePath);
        expect(ast.kind).to.equal(ts.SyntaxKind.SourceFile);
        expect(normalizeLineBreaks(source)).to.equal(`const a=1;
export const b=a;`);
    });
});

describe(`scan, Given a valid AST`, () => {
    const samplePath = require.resolve('../../test/resources/scanner/sample.tsx');
    const fs = nodeFs;
    const scanner = new FileAstLoader(fs, samplePath);
    const { ast } = scanner.getAst(samplePath);

    it('should run visitor on every node of the AST once', () => {
        const visited = [] as ts.Node[];
        scan(ast, node => {
            if (visited.find(i => i === node)) {
                fail('A node was visited more than once');
            }
            visited.push(node);
        });
        expect(visited).to.have.length(13, 'some nodes were not visited');
    });

    it('should return the points of interest, as returned from the visitor', () => {
        const result = scan(ast, node => node.kind === ts.SyntaxKind.VariableDeclaration ? 'Var!' : undefined);
        expect(result).to.have.length(2);
        expect(result[0]).to.haveOwnProperty('node');
        expect(result[0]).to.haveOwnProperty('note');
    });

    describe('api', () => {

        describe('ignoreChildren', () => {
            it(`should not call visitor on the node's children`, () => {
                const result = scan(ast, (_, { ignoreChildren }) => {
                    ignoreChildren!();
                    return 'Visited';
                });
                expect(result).to.have.length(1);
                expect(result[0].node.kind).to.equal(ts.SyntaxKind.SourceFile);
            });
        });

        describe('report', () => {
            it('should add an additional point of interest to the spawning scan', () => {
                const result = scan(ast, (node, { report }) => {
                    report!({
                        node,
                        note: 'Reported'
                    });
                    return 'Visited';
                });
                expect(result).to.have.length(26);
            });

            it('should be able to report points of interest on behalf of children in seamlessly', () => {
                const result = scan(ast, (node, { ignoreChildren, report }) => {
                    ignoreChildren();
                    node.forEachChild(child => {
                        report(scan(child, () => {
                            return 'Descendent';
                        }));
                    });

                    return 'Root';
                });
                expect(result.filter(i => i.note === 'Root')).to.have.length(1);
                expect(result.filter(i => i.note === 'Descendent')).to.have.length(12);
            });
        });

        describe('stop', () => {
            it('should not visit any nodes after after a visitor executed stop', () => {
                let visited = 0;
                const result = scan(ast, (_, { stop }) => {
                    if (visited++ >= 5) {
                        stop();
                    }
                    return 'Visited';
                });
                expect(result).to.have.length(5 + 1);
            });
        });
    });

    describe('find', () => {
        it('should find the first (dfs) node that matches the predicate', () => {
            const found = find(ast, n => n.kind === ts.SyntaxKind.ExportKeyword);
            expect(found.kind).to.equal(ts.SyntaxKind.ExportKeyword);
        });
        it('should return undefined when no match is found', () => {
            const found = find(ast, n => n.kind === ts.SyntaxKind.JsxAttribute);
            // tslint:disable-next-line: no-unused-expression
            expect(found).to.be.undefined;
        });
    });
});