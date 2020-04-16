import { asAst } from '../parser';
import { expect } from 'chai';
import ts from 'typescript';
import { cCall, cLiteralAst, cObject } from '.';
import { transformerApiProvider, getFileTransformationAPI } from '../..';

describe('transformerApiProvider', () => {
    it('should wrap transformers providing extra API and not change the ast', () => {

        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, [transformerApiProvider((_ctx: ts.TransformationContext) => {
            return (node: ts.Node) => {
                const api = getFileTransformationAPI(node.getSourceFile());
                expect(api.getAnalyzed().compDefinitions.length).to.equal(0);
                return node;
            };
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expect(res.transformed[0]).to.have.astLike(ast);
    });

    it('should allow prepanding statements', () => {

        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, [transformerApiProvider((_ctx: ts.TransformationContext) => {

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
        expect(res.transformed[0]).to.have.astLike(`console.log('gaga');
        console.log('hello');
        `);
    });

    it('should allow appending statements', () => {

        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, [transformerApiProvider((_ctx: ts.TransformationContext) => {

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
        expect(res.transformed[0]).to.have.astLike(`console.log('hello');
        console.log('gaga');
        `);
    });

    it('should allow appending private vars', () => {
        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, [transformerApiProvider((_ctx: ts.TransformationContext) => {

            return (node: ts.Node) => {
                const api = getFileTransformationAPI(node.getSourceFile());
                const refToVar = api.appendPrivateVar('myStr', cLiteralAst('gaga'));
                return cCall(['console', 'log'], [refToVar]);
            };
        })]);
        expect(res.diagnostics!.length).to.equal(0);
        expect(res.transformed[0]).to.have.astLike(`var __private_tsx_air__ = {
                myStr0: 'gaga'
            };
            console.log(__private_tsx_air__.myStr0)`);
    });

    describe('ensure import', () => {
        it('should allow adding imports', () => {
            const ast = asAst(`console.log('hello')`, true).getSourceFile();
            const res = ts.transform(ast, [transformerApiProvider((_ctx: ts.TransformationContext) => {
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
            expect(res.transformed[0]).to.have.astLike(`import defaultExport, { namedImport } from 'somewhere';
                console.log({
                    refToNamed: namedImport,
                    refToDefault: defaultExport
                })`);
        });
    });
});
