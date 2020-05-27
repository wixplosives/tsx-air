import { functions, basicPatterns, conditional } from "../../test.helpers";
import { asCode, asAst, evalAst } from "@tsx-air/compiler-utils/src";
import { _getJsxRoots, parseFragments, fragId, generateFragment, Fragment } from "./jsx.fragment";
import get from "lodash/get";
import ts from "typescript";
import { getCompDef } from "@tsx-air/compiler-utils/src/analyzers/test.helpers";
import { expect } from "chai";



describe('fragments', () => {
    describe(`parseFragments`, () => {
        // xdescribe(`preRender`, () => {
        //     it(`does not contain and JSX`, () => {
        //         const { comp } = getCompDef(`const Comp=TSXAir(() => {
        //             const b = <div />;
        //             return <div>{b}</div>;
        //         })`);
        //         expect(asCode(parseComp(comp).preRender)).not.to.include('<div>');
        //     });
        //     it(`returns a fragment`, () => {

        //     });
        // });
        it(`creates a fragment for every JSX root`, () => {
            const { comp } = getCompDef(`const Comp=TSXAir(() => {
                    const notJsx = {};
                    const simpleFragment = <div />;
                    return <div>{<InnerComp />}</div>;
                })`);
            const statements = get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];

            const fragments = parseFragments(comp);
            expect(fragments).to.have.length(3);
            expect(fragments[0]).to.eql({
                root: comp.jsxRoots[0],
                hasInnerFragments: false,
                id: fragId('Comp', 0),
                index: 0,
                src: [statements[1]]
            });
            expect(fragments[1]).to.eql({
                root: comp.jsxRoots[1].expressions[0].jsxRoots[0],
                hasInnerFragments: false,
                id: fragId('Comp', 1),
                index: 1,
                src: [statements[2]]
            });
            expect(fragments[2]).to.eql({
                root: comp.jsxRoots[1],
                hasInnerFragments: true,
                id: fragId('Comp', 2),
                index: 2,
                src: [statements[2]]
            });
        })
    });

    describe(`generateFragment`, () => {
        it(`generates fragment with toString`, () => {
            const { comp } = getCompDef(`const Comp=TSXAir(() => {
                const notJsx = {};
                const simpleFragment = <div />;
                return <div>{<p />}</div>;
            })`);
            const toStringOf = (f: Fragment) =>
                // @ts-ignore
                evalAst(generateFragment(comp, f))({ $key: 'KEY' });

            const fragments = parseFragments(comp);
            // expect(toStringOf(fragments[0])).to.eql(`<div xTxKey="KEY"></div>`);
            // expect(toStringOf(fragments[1])).to.eql(`<p xTxKey="KEY"></p>`);
            expect(toStringOf(fragments[2])).to.eql(`<div>{${fragments[1].id}.toString({$key:'0'})}</div>`);
        })
    });
});

// it(`creates fragments from jsx`, () => {
//     const { comp } = getCompDef(`const Comp=TSXAir(() => {
//             const a=3;
//             const b = <div />;
//             const c = a>4? b : <span />
//             return <div>{<p />}{c}</div>;
//         })`);
//     console.log(asCode(parseComp(comp).preRender));
//     console.log(parseComp(comp).fragments.map(f => asCode(f.root.sourceAstNode)));
// });

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
            expect([..._getJsxRoots(comp, statements[3])]).to.eql([comp.jsxRoots[2].expressions[0].jsxRoots[0], comp.jsxRoots[2]]);;
        })
    })

});