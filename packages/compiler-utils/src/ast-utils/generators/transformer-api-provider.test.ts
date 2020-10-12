import { asAst } from '../parser';
import { expect } from 'chai';
import ts from 'typescript';
import { cCall, cLiteralAst } from '.';
import { transformerApiProvider } from '../..';
import { asCode } from '../../dev-utils';

describe('transformerApiProvider', () => {
    it('should wrap transformers providing extra API and not change the ast', () => {
        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, transformerApiProvider([api => _ctx => node => {
            expect(api().getAnalyzed().compDefinitions.length).to.equal(0);
            return node;
        }]));
        expect(res.diagnostics!.length).to.equal(0);
        expect(res.transformed[0]).to.have.astLike(ast);
    });

    it('should allow prepanding statements', () => {
        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, transformerApiProvider([api => _ctx => node => {
            api().prependStatements(
                ts.createStatement(
                    cCall(['console', 'log'], [cLiteralAst('gaga')])
                )
            );
            return node;
        }]));
        expect(res.diagnostics!.length).to.equal(0);
        expect(res.transformed[0]).to.have.astLike(`console.log('gaga');
        console.log('hello');
        `);
    });

    it('should allow appending statements', () => {
        const ast = asAst(`console.log('hello')`, true).getSourceFile();
        const res = ts.transform(ast, transformerApiProvider([api => _ctx => node => {
            api().appendStatements(
                ts.createStatement(
                    cCall(['console', 'log'], [cLiteralAst('gaga')])
                )
            );
            return node;
        }
        ]));
        expect(res.diagnostics!.length).to.equal(0);
        expect(res.transformed[0]).to.have.astLike(`console.log('hello');
        console.log('gaga');
        `);
    });

    describe('ensure import', () => {
        it('should allow adding imports', () => {
            const ast = asAst(`console.log('hello')`, true).getSourceFile();
            const res = ts.transform(ast, transformerApiProvider([api => _ctx => _node => {
                const refToNamed = api().ensureImport('namedImport', 'somewhere');
                const refToDefault = api().ensureDefaultImport('defaultExport', 'somewhere');
                return ts.createSourceFile('tst.ts', `console.log({
                        refToNamed: ${asCode(refToNamed)},
                        refToDefault: ${asCode(refToDefault)}
                    })`, ts.ScriptTarget.ESNext);
            }]));
            expect(res.diagnostics!.length).to.equal(0);
            expect(res.transformed[0]).to.have.astLike(`import defaultExport, { namedImport } from 'somewhere';
                console.log({
                    refToNamed: namedImport,
                    refToDefault: defaultExport
                })`);
        });
    });

    describe('removeImport', () => {
        it(`removes all imports from the given module`, () => {
            const file = ts.createSourceFile('tst.ts', `
                import * as mock from '@tsx-air/mock1';
                import {mock} from '@tsx-air/mock2';
                import '@tsx-air/mock3';
                import {unaffected} from 'dont-remove';
            `, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

            const res = ts.transform(file, transformerApiProvider([api => _ctx => node => {
                api().removeImport('@tsx-air/mock1');
                api().removeImport('@tsx-air/mock2');
                api().removeImport('@tsx-air/mock3');
                return node;
            }]));

            expect(res.diagnostics!.length).to.equal(0);
            expect(res.transformed[0]).to.have.astLike(`import {unaffected} from 'dont-remove';`);
        });
    });
});
