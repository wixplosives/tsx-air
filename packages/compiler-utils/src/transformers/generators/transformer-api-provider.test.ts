import { parseStatement } from '../../astUtils/parser';
import { expect } from 'chai';
import ts from 'typescript';
import { printAST } from '../../dev-utils/print-ast';
import { expectEqualIgnoreWhiteSpace } from '../../dev-utils/expect-equal-ingnore-whitespace';
import { transfromerApiProvider, getFileTransformationAPI } from './transformer-api-provider';
import { cCall, cLiteralAst, cObject } from './ast-generators';


describe('transfromerApiProvider', () => {
    it('should wrap transformers providing extra API and not change the ast', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [transfromerApiProvider((_ctx: ts.TransformationContext) => {
            return (node: ts.Node) => {
                const api = getFileTransformationAPI(node.getSourceFile());
                expect(api.getAnalayzed().compDefinitions.length).to.equal(0);
                return node;
            };
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), printAST(ast));
    });

    it('should allow prepending statements', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [transfromerApiProvider((_ctx: ts.TransformationContext) => {

            return node => {
                const api = getFileTransformationAPI(node.getSourceFile());
                api.prependStatements(
                    ts.createStatement(
                        cCall(['console', 'log'], [cLiteralAst('gaga')])
                    )
                );
                return node;
            };
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), `console.log('gaga');
        console.log('hello');
        `);
    });

    it('should allow appending statements', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [transfromerApiProvider((_ctx: ts.TransformationContext) => {

            return (node: ts.Node) => {
                const api = getFileTransformationAPI(node.getSourceFile());
                api.appendStatements(
                    ts.createStatement(
                        cCall(['console', 'log'], [cLiteralAst('gaga')])
                    )
                );
                return node;
            };
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expectEqualIgnoreWhiteSpace(printAST(res.transformed[0]), `console.log('hello');
        console.log('gaga');
        `);
    });

    it('should allow appending private vars', () => {

        const ast = parseStatement(`console.log('hello')`).getSourceFile();
        const res = ts.transform(ast, [transfromerApiProvider((_ctx: ts.TransformationContext) => {

            return (node: ts.Node) => {
                const api = getFileTransformationAPI(node.getSourceFile());
                const refToVar = api.appendPrivateVar('myStr', cLiteralAst('gaga'));
                return cCall(['console', 'log'], [refToVar]);
            };
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
            const res = ts.transform(ast, [transfromerApiProvider((_ctx: ts.TransformationContext) => {
                return node => {
                    const api = getFileTransformationAPI(node.getSourceFile());
                    const refToNamed = api.ensureImport('namedImport', 'somewhere');
                    const refToDefault = api.ensureDefaultImport('defaultExport', 'somewhere');
                    return cCall(['console', 'log'], [cObject({
                        refToNamed,
                        refToDefault,
                    })]);
                };
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
