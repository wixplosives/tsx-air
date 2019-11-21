import { parseStatement } from '../../astUtils/parser';
import { expect } from 'chai';
import ts from 'typescript';
import { printAST } from '../../dev-utils/print-ast';
import { expectEqualIgnoreWhiteSpace } from '../../dev-utils/expect-equal-ingnore-whitespace';
import { appendNodeTransformer, GeneratorContext } from './append-node-transformer';
import { cCall, cLiteralAst } from './ast-generators';


describe('AppendNodeTransformer', () => {
    it('should wrap generator transformers providing extra API and not change the ast', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: GeneratorContext, _ctx: ts.TransformationContext) => {
            expect(genCtx.getScanRes().sourceAstNode).to.equal(ast);
            return node => node;
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), printAST(ast));
    });

    it('should allow prepending statements', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: GeneratorContext, _ctx: ts.TransformationContext) => {
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
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: GeneratorContext, _ctx: ts.TransformationContext) => {
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
        const res = ts.transform(ast, [appendNodeTransformer((genCtx: GeneratorContext, _ctx: ts.TransformationContext) => {
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
});
