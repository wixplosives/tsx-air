import { asAst, parseValue } from './parser';
import { cloneDeep } from './clone.deep';
import { expect, use } from 'chai';
import ts, { getMutableClone } from 'typescript';
import { chaiPlugin } from '@tsx-air/testing';
import { printAst } from '..';
import { compilerOptions } from '@tsx-air/compiler-utils';
use(chaiPlugin);

describe('cloneDeep', () => {
    it('return a clone of the source', () => {
        const ast = parseValue(`window.location`) as ts.PropertyAccessExpression;
        const clone = cloneDeep(ast);

        expect(clone).to.have.astLike(`window.location`);
        expect(clone).to.not.equal(ast);
        expect(clone.expression).to.not.equal(ast.expression);
    });

    it(`returns a node that can be attached to another ast tree`, () => {
        const ast = asAst(`window.location`, true);
        const clone = cloneDeep(ast);

        const asArrowFunc = (node: ts.Statement) =>
            ts.transpileModule('/* */ const a=1; const b=2;',
                {
                    compilerOptions,
                    transformers: {
                        before: [
                            _ => n => {
                                const s = getMutableClone(n);
                                s.statements = ts.createNodeArray([
                                    ts.createBlock([]),
                                    node
                                ]);
                                return s;
                            }
                        ]
                    }
                }).outputText;

        const expected = `{ }\nwindow.location;\n`;

        expect(asArrowFunc(ast),
            `should be jumbled due to not being on the same ast tree (sourcefile)`
        ).not.to.equal(expected);

        expect(asArrowFunc(clone).replace(/\r/g,''),
        ).to.equal(expected);
    });

    it(`should be clone modifiers`, () => {
        const ast = asAst(`const a=1`) as ts.PropertyAccessExpression;
        const clone = cloneDeep(ast);

        expect(printAst(clone)).to.equal(`const a = 1`, `const (modifier of var) was not kept`);
    });
});