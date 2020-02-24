import ts from 'typescript';
import { isString, last } from 'lodash';

interface CFunc<P, B> {
    _params: P;
    _body: B;
}

export function _cFunc(params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>
    | ts.NodeArray<ts.ParameterDeclaration>,
    body: ts.Block | ts.Statement[]): CFunc<ts.ParameterDeclaration[], ts.Block>;
export function _cFunc(params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>, body: ts.Expression): CFunc<ts.ParameterDeclaration[], ts.Expression>;
export function _cFunc(params:
    Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>
    | ts.NodeArray<ts.ParameterDeclaration>,
    body: ts.Block | ts.ConciseBody | ts.Statement[]) {
    while (params instanceof Array && params.length && last(params) === undefined) {
        params.pop();
    }
    return {
        _params: params instanceof Array
            ? params.map((item, i) =>
                !item || isString(item) || ts.isObjectBindingPattern(item)
                    ? ts.createParameter(undefined, undefined, undefined, item || `__${i}`, undefined, undefined, undefined)
                    : item)
            : params,
        _body: body instanceof Array
            ? ts.createBlock(body)
            : body
    };
}

export const _cAccess = (safe: boolean, callPath: string[]) => {
    type Access = ts.PropertyAccessExpression | ts.PropertyAccessChain | ts.Identifier;
    let ret: Access;
    const create = (base: Access, p: string) => safe
        ? ts.createPropertyAccessChain(
            base,
            ts.createToken(ts.SyntaxKind.QuestionDotToken),
            ts.createIdentifier(p))
        : ts.createPropertyAccess(base, p);

    callPath.forEach(p => {
        ret = ret
            ? create(ret, p)
            : ts.createIdentifier(p);
    });
    return ret!;
};
