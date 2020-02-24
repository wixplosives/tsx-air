import ts from 'typescript';
import { _cFunc } from './helpers';
import { cAccess } from '.';

export const cFunction = (params: string[], statements: ts.Statement[]) => {
    return ts.createFunctionExpression(undefined, undefined, undefined, undefined,
        cParams(params), undefined, ts.createBlock(statements));
};

export const cParams = (params: string[]) => params.map(val => ts.createParameter(undefined, undefined, undefined, val));


export const cCall = (callPath: string[], args: ts.Expression[]) => {
    let identifier: ts.Expression = ts.createIdentifier(callPath[0]);
    for (let i = 1; i < callPath.length; i++) {
        identifier = ts.createPropertyAccess(identifier, callPath[i]);
    }

    return ts.createCall(cAccess(...callPath), undefined, args);
};

export const cArrow = (params: Array<string | ts.ObjectBindingPattern | undefined>, body: ts.ConciseBody | ts.Statement[]) => {
    const { _params, _body } = _cFunc(params, body as ts.Expression);
    return ts.createArrowFunction(undefined, undefined, _params, undefined, undefined, _body);
};
