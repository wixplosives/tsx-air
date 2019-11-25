import { parseStatement } from '../../astUtils/parser';
import { expect } from 'chai';
import ts from 'typescript';
import { printAST } from '../../dev-utils/print-ast';
import { expectEqualIgnoreWhiteSpace } from '../../dev-utils/expect-equal-ingnore-whitespace';
import { appendNodeTransformer, FileTransformerAPI } from './append-node-transformer';
import { cCall, cLiteralAst, cObject } from './ast-generators';


describe('AppendNodeTransformer', () => {
    it('should wrap generator transformers providing extra API and not change the ast', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: FileTransformerAPI, _ctx: ts.TransformationContext) => {
            expect(genCtx.getAnalayzed().sourceAstNode).to.equal(ast);
            return node => node;
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), printAST(ast));
    });

    it('should allow prepending statements', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: FileTransformerAPI, _ctx: ts.TransformationContext) => {
            genCtx.prependStatements(
                ts.createStatement(
                    cCall(['console', 'log'], [cLiteralAst('gaga')])
                )
            );
            return node => node;
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), `console.log('gaga');
        console.log('hello');
        `);
    });

    it('should allow appending statements', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: FileTransformerAPI, _ctx: ts.TransformationContext) => {
            genCtx.appendStatements(
                ts.createStatement(
                    cCall(['console', 'log'], [cLiteralAst('gaga')])
                )
            );
            return node => node;
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), `console.log('hello');
        console.log('gaga');
        `);
    });

    it('should allow appending private vars', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: FileTransformerAPI, _ctx: ts.TransformationContext) => {
            const refToVar = genCtx.appendPrivateVar('myStr', cLiteralAst('gaga'));
            return _node => cCall(['console', 'log'], [refToVar]);
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), `var __private_tsx_air__ = {
            myStr0: 'gaga'
        };
        console.log(__private_tsx_air__.myStr0)
        `);
    });

    describe('ensure import', () => {
        it('should allow adding imports', () => {

            const ast = parseStatement(`console.log('hello')`).getSourceFile();
            const res = ts.transform(ast, [appendNodeTransformer((genCtx: FileTransformerAPI, _ctx: ts.TransformationContext) => {
                const refToNamed = genCtx.ensureImport('namedImport', 'somewhere');
                const refToDefault = genCtx.ensureDefaultImport('defaultExport', 'somewhere');
                return _node => cCall(['console', 'log'], [cObject({
                    refToNamed,
                    refToDefault,
                })]);
            })]);
            expect(res.diagnostics!.length).to.equal(0);
            expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), `import defaultExport, { namedImport } from 'somewhere';
            console.log({
                refToNamed: namedImport,
                refToDefault: defaultExport
            })
            `);
        });
    });
});
