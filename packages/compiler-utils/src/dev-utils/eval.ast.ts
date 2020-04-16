import ts from 'typescript';
import { compilerOptions } from '@tsx-air/compiler-utils';
// @ts-ignore
import { Script } from 'vm';

export const evalAst = (obj: ts.Expression, context?: object) => {
    const code = ts.transpileModule(
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
    }).outputText;
    const script = new Script(code);
    return script.runInNewContext(context || {})();
};