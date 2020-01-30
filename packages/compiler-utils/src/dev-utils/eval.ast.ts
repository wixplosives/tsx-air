import ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';

// tslint:disable-next-line: no-eval
export const evalAst = (obj: ts.Expression) => eval(ts.transpileModule(
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
