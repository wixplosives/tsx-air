import ts from 'typescript';
import { _cFunc } from './helpers';
import { cAccess } from '.';

export const cFunction = (
    params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>,
    body: ts.Block | ts.Statement[]) => {
    const { _params, _body } = _cFunc(params, body);
    return ts.createFunctionExpression(undefined, undefined, undefined, undefined, _params, undefined, _body);
};

export const cParams = (params: string[]) => params.map(val => ts.createParameter(undefined, undefined, undefined, val));

export const cCall = (callPath: string[], args: ts.Expression[]) => {
    let identifier: ts.Expression = ts.createIdentifier(callPath[0]);
    for (let i = 1; i < callPath.length; i++) {
        identifier = ts.createPropertyAccess(identifier, callPath[i]);
    }

    return ts.createCall(cAccess(...callPath), undefined, args);
};

export const cArrow = (
    params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>,
    body: ts.ConciseBody | ts.Statement[]) => {
    const { _params, _body } = _cFunc(params, body as ts.Expression);
    return ts.createArrowFunction(undefined, undefined, _params, undefined, undefined, _body);
};

export const cCompactArrow = (
    params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>,
    body: ts.Statement[],
    returnValue: ts.Expression
) => {
    if (returnValue) {
        return body?.length
            ? cArrow(params, [...body, ts.createReturn(returnValue)])
            : cArrow(params, returnValue);
    } else {
        return body?.length
            ? cArrow(params, body)
            : cArrow([], ts.createIdentifier('undefined'));

    }

};

export const cSpreadParams = (name: string) =>
    ts.createParameter(
        undefined,
        undefined,
        ts.createToken(ts.SyntaxKind.DotDotDotToken),
        ts.createIdentifier(name));


export function cReturnLiteral(keys: string[]): ts.ReturnStatement {
    return ts.createReturn(ts.createObjectLiteral(
        [...keys.values()].map(
            v => ts.createShorthandPropertyAssignment(
                ts.createIdentifier(v),
                undefined
            )
        ),
        false));
}
