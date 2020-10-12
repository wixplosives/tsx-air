import { _getJsxRoots, parseFragments } from './jsx.fragment';
import get from 'lodash/get';
import ts from 'typescript';
import { getCompDef } from '@tsx-air/compiler-utils/src/analyzers/test.helpers';
import { expect } from 'chai';


describe('fragments', () => {
    describe(`parseFragments`, () => {
        it(`creates a fragment for every JSX root`, () => {
            const { comp } = getCompDef(`const Comp=TSXAir(() => {
                    const notJsx = {};
                    const simpleFragment = <div />;
                    return <div>{<InnerComp />}</div>;
                })`);
            const statements = get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];

            const allFragments = [...parseFragments(comp)];
            expect(allFragments).to.have.length(3);
            expect(allFragments[0]).to.deep.include({
                root: comp.jsxRoots[0],
                hasInnerFragments: false,
                id: 'div0',
                index: 0,
                src: statements[1],
                isComponent: false,
                code:comp
            });
            expect(allFragments[1]).deep.include({
                root: comp.jsxRoots[1].expressions[0].jsxRoots[0],
                hasInnerFragments: false,
                id: 'InnerComp1',
                index: 1,
                src: statements[2],
                isComponent: true,
                allFragments,code:comp
            });
            expect(allFragments[2]).deep.include({
                root: comp.jsxRoots[1],
                hasInnerFragments: true,
                id: 'div2',
                index: 2,
                src: statements[2],
                isComponent: false,
                allFragments,code:comp
            });
        });
    });

    describe('internals', () => {
        describe(`getAstStatementJsxRoots`, () => {
            it(`finds analyzed roots of an ast node`, () => {
                const { comp } = getCompDef(`const Comp=TSXAir(() => {
                        const a=3;
                        const b = <div />;
                        const c = <span>{<p />}</span>;
                        return <div>{<p />}{c}</div>;
                    })`);

                const statements = get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
                expect([..._getJsxRoots(comp, statements[0])]).to.eql([]);
                expect([..._getJsxRoots(comp, statements[1])]).to.eql([comp.jsxRoots[0]]);
                expect([..._getJsxRoots(comp, statements[2])]).to.eql([comp.jsxRoots[1].expressions[0].jsxRoots[0], comp.jsxRoots[1]]);
                expect([..._getJsxRoots(comp, statements[3])]).to.eql([comp.jsxRoots[2].expressions[0].jsxRoots[0], comp.jsxRoots[2]]);
            });
        });
    });
});