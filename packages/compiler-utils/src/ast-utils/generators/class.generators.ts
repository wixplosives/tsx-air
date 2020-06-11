import ts from 'typescript';
import { _cFunc } from './helpers';
import { cParams, cAccess } from '.';


export interface ClassConstructor {
    params: string[];
    statements: ts.Statement[];
}

export const cBind = (name: string) =>
    ts.createCall(
        ts.createPropertyAccess(
            ts.createPropertyAccess(
                ts.createThis(),
                ts.createIdentifier(name)
            ),
            ts.createIdentifier('bind')
        ),
        undefined,
        [ts.createThis()]
    );


export const cProperty = (name: string, initializer: ts.Expression | undefined) => ts.createProperty(
    undefined,
    [],
    ts.createIdentifier(name),
    undefined,
    undefined,
    initializer
);

export function cMethod(name: string, params:
    Array<string | ts.ObjectBindingPattern | undefined>
    | ts.NodeArray<ts.ParameterDeclaration>,
    body: ts.Block | ts.Statement[], asStatic = false): ts.MethodDeclaration {
    const { _params, _body } = _cFunc(params, body);
    return ts.createMethod(undefined, asStatic
        ? [ts.createModifier(ts.SyntaxKind.StaticKeyword)]
        : undefined, undefined, name,
        undefined, undefined, _params, undefined, _body);
}
export function cGet(name: string, body: ts.Block | ts.Statement[]): ts.GetAccessorDeclaration {
    const {  _body } = _cFunc([], body);
    return ts.createGetAccessor(undefined, undefined, name,
        [], undefined, _body);
}

export const cStatic = (name: string, initializer: ts.Expression | undefined) => ts.createProperty(
    undefined,
    [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
    ts.createIdentifier(name),
    undefined,
    undefined,
    initializer
);

export const cClass = (name: string, extendz?: string | ts.Expression,
    constructorInfo?: ClassConstructor,
    properties: Array<ts.PropertyDeclaration | ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration> = []) => {
    const allMembers = constructorInfo ? [
        ts.createConstructor(undefined, undefined, cParams(constructorInfo.params), ts.createBlock(constructorInfo.statements)) as ts.ClassElement
    ].concat(properties) : properties;
    return ts.createClassDeclaration(
        undefined,
        [],
        ts.createIdentifier(name),
        undefined,
        extendz ? [ts.createHeritageClause(
            ts.SyntaxKind.ExtendsKeyword,
            [
                ts.createExpressionWithTypeArguments(undefined, typeof extendz === 'string' ? ts.createIdentifier(extendz) : extendz)
            ]
        )] : undefined,
        allMembers
    );
};

export const cNew = (classPath: string[], args: ts.Expression[] = []) => {
    return ts.createNew(cAccess(...classPath), undefined, args);
};
