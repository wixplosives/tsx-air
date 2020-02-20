import ts from 'typescript';
import isArray from 'lodash/isArray';
import last from 'lodash/last';
import isString from 'lodash/isString';

export interface AstGeneratorsOptions {
    useSingleQuatres: boolean;
    multiline: boolean;
}

export const defaultOptions: AstGeneratorsOptions = {
    useSingleQuatres: true,
    multiline: true
};

export const cArrow = (params: Array<string | ts.ObjectBindingPattern | undefined>, body: ts.ConciseBody | ts.Statement[]) => {
    const { _params, _body } = _cFunc(params, body as ts.Expression);
    return ts.createArrowFunction(undefined, undefined, _params, undefined, undefined, _body);
};

interface CFunc<P, B> {
    _params: P;
    _body: B;
}


function _cFunc(params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>
    | ts.NodeArray<ts.ParameterDeclaration>,
    body: ts.Block | ts.Statement[]): CFunc<ts.ParameterDeclaration[], ts.Block>;
function _cFunc(params: Array<string | ts.ObjectBindingPattern | ts.ParameterDeclaration | undefined>, body: ts.Expression): CFunc<ts.ParameterDeclaration[], ts.Expression>;
function _cFunc(params:
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

export const cAccess = (...callPath: string[]) => _cAccess(false, callPath);
export const cSafeAccess = (...callPath: string[]) => _cAccess(true, callPath);

const _cAccess = (safe: boolean, callPath: string[]) => {
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

export const cCall = (callPath: string[], args: ts.Expression[]) => {
    let identifier: ts.Expression = ts.createIdentifier(callPath[0]);
    for (let i = 1; i < callPath.length; i++) {
        identifier = ts.createPropertyAccess(identifier, callPath[i]);
    }

    return ts.createCall(cAccess(...callPath), undefined, args);
};


/**
 * creates a literal pojo from a literal pojo, supports nested expressions
 */
export const cObject = (properties: Record<string, any>, options: AstGeneratorsOptions = defaultOptions) => {
    return ts.createObjectLiteral(
        Object.entries(properties).map(([name, value]) => {
            return ts.createPropertyAssignment(`"${name}"`,
                cLiteralAst(value, options));
        }), options.multiline);
};

export const cArray = (items: any[], options: AstGeneratorsOptions = defaultOptions) => {
    return ts.createArrayLiteral(items.map(item => cLiteralAst(item, options)));
};

export function cLiteralAst(item: any, options: AstGeneratorsOptions = defaultOptions): ts.Expression {
    const exp = isTSNode(item) ? item :
        isArray(item) ? cArray(item, options) :
            (typeof item === 'object') ? cObject(item, options) :
                cPrimitive(item, options);

    if (exp === null) {
        throw new Error('unknown conversion');
    }
    return exp as ts.Expression;
}

export function isTSNode(node: any): node is ts.Node {
    return node && !!node.kind;
}

export const cPrimitive = (input: any, options: AstGeneratorsOptions = defaultOptions) => {
    if (typeof input === 'string') {
        const res = ts.createStringLiteral(input);
        (res as any).singleQuote = options.useSingleQuatres;
        return res;
    }
    if (typeof input === 'number') {
        return ts.createNumericLiteral(input.toString());
    }
    if (typeof input === 'boolean') {
        return input ? ts.createTrue() : ts.createFalse();
    }
    return null;
};


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
    body: ts.Block | ts.Statement[]): ts.MethodDeclaration {
    const { _params, _body } = _cFunc(params, body);
    return ts.createMethod(undefined, undefined, undefined, name,
        undefined, undefined, _params, undefined, _body);
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
    properties: Array<ts.PropertyDeclaration | ts.MethodDeclaration> = []) => {
    const allMembers = constructorInfo ? [
        ts.createConstructor(undefined, undefined, cParams(constructorInfo.params), ts.createBlock(constructorInfo.statements)) as ts.ClassElement
    ].concat(properties) : properties;
    return ts.createClassDeclaration(
        undefined,
        [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
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

function createSynthesizedNode(kind: ts.SyntaxKind) {
    const node = ts.createNode(kind, -1, -1);
    node.flags |= 8 /* Synthesized */;
    return node;
}

export const cloneDeep = <T extends ts.Node>(node: T, parent?: ts.Node) => {
    const clone = createSynthesizedNode(node.kind) as T;
    if (parent) {
        clone.parent = parent;
    }
    for (const key in node) {
        if (clone.hasOwnProperty(key) || !node.hasOwnProperty(key)) {
            continue;
        }
        if (node[key] && (node[key] as any).kind) {
            clone[key] = (cloneDeep(node[key] as any as ts.Node, node) as any);
        } else if (node[key] && (node[key] as any).length && (node[key] as any)[0].kind) {
            clone[key] = (node[key] as any as ts.Node[]).map(item => cloneDeep(item, node)) as any;
        } else {
            clone[key] = node[key];
        }
    }
    clone.pos = -1;
    clone.end = -1;
    return clone;
};

export const cAssign = (to: string[], from: string[] | ts.Expression) => {
    if (isTSNode(from)) {
        return ts.createStatement(
            ts.createAssignment(cAccess(...to), cloneDeep(from))
        );
    }
    return ts.createStatement(
        ts.createAssignment(cAccess(...to), cAccess(...from))
    );
};

interface ImportSpecifierDef {
    localName?: string;
    importedName: string;
}

export interface ImportDefinition {
    modulePath: string;
    exports: ImportSpecifierDef[];
    defaultLocalName?: string;
}
export const cImport = (info: ImportDefinition) => {
    return ts.createImportDeclaration(undefined, undefined,
        ts.createImportClause(
            info.defaultLocalName ? ts.createIdentifier(info.defaultLocalName) : undefined,
            info.exports.length ? ts.createNamedImports(info.exports.map(exp => ts.createImportSpecifier(exp.localName ? ts.createIdentifier(exp.importedName) : undefined, exp.localName ? ts.createIdentifier(exp.localName) : ts.createIdentifier(exp.importedName)))) : undefined
        ), cLiteralAst(info.modulePath));
};

export const createBitWiseOr = (comp: string, fields: string[], flags: string[] = []) => {
    const target: ts.Expression = cAccess(comp, 'changeBitmask');
    let res: ts.Expression;
    fields.forEach(fieldName => {
        const field = cFieldAccess(target, fieldName);
        res = res
            ? ts.createBinary(res, ts.SyntaxKind.FirstBinaryOperator, field)
            : field;
    });
    flags.forEach(flag => {
        const field = cFieldAccess('TSXAir.runtime.flags', flag);
        res = res
            ? ts.createBinary(res, ts.SyntaxKind.BarToken, field)
            : field;
    });

    return res!;
};

export const cFieldAccess = (target: string | ts.Expression, field: string | ts.StringLiteral) => {
    if (typeof target === 'string') {
        target = cAccess(...target.split('.'));
    }
    if (typeof field === 'string') {
        field = ts.createStringLiteral(field);
    }
    return ts.createElementAccess(target, field);
};

export const cIf = (condition: ts.Expression, statements: ts.Statement[]) => {
    return ts.createIf(condition, ts.createBlock(statements));
};

export const cFunction = (params: string[], statements: ts.Statement[]) => {
    return ts.createFunctionExpression(undefined, undefined, undefined, undefined,
        cParams(params), undefined, ts.createBlock(statements));
};

export const cParams = (params: string[]) => params.map(val => ts.createParameter(undefined, undefined, undefined, val));

export const cNew = (classPath: string[], args: ts.Expression[] = []) => {
    return ts.createNew(cAccess(...classPath), undefined, args);
};
