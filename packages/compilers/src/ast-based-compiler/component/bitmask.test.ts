import { TsxFile, printAst } from '@tsx-air/compiler-utils';
import { parseFixture } from '../../test.helpers';
import { generateChangeBitMask } from './bitmask';
import { analyze } from '@tsx-air/compiler-utils';
import { expect } from 'chai';
import ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';

// tslint:disable-next-line: no-eval
const evalObject = (obj: ts.ObjectLiteralExpression) => eval(ts.transpileModule(
    ``, {
    compilerOptions,
    transformers: {
        before: [
            _ => node => {
                const n = ts.getMutableClone(node);
                n.statements = ts.createNodeArray([
                    ts.createExpressionStatement(ts.createArrowFunction(
                        undefined,
                        undefined,
                        [],
                        undefined,
                        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        ts.createParen(obj)))
                ]);
                return n;
            }
        ]
    }
}).outputText)();

describe('createChangeBitMask', () => {
    const ast = parseFixture(`bitmask.tsx`);
    const [withNothing, withProps, withState, withBoth] =
        (analyze(ast).tsxAir as TsxFile).compDefinitions;
    it('should assign a key for every used props and store key', () => {
        expect(evalObject(generateChangeBitMask(withNothing)))
            .to.eql({});
        expect(evalObject(generateChangeBitMask(withProps)))
            .to.eql({ a: 1 << 0, b: 1 << 1 });
        expect(evalObject(generateChangeBitMask(withState)))
            .to.eql({ store1_a: 1 << 0, store1_b: 1 << 1 });
        expect(evalObject(generateChangeBitMask(withBoth)))
            .to.eql({ a: 1 << 0, b: 1 << 1, store2_a: 1 << 2, store2_b: 1 << 3 });

    });
});