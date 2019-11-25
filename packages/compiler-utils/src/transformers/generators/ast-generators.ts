import ts from 'typescript';
import { isArray } from 'util';
import { JsxRoot, CompDefinition } from '../../analyzers/types';
import { DomBinding } from './component-common';
import { parseValue } from '../../astUtils/parser';


export interface AstGeneratorsOptions {
    useSingleQuates: boolean;
    multiline: boolean;
}

export const defaultOptions: AstGeneratorsOptions = {
    useSingleQuates: true,
    multiline: true
};

export const cArrow = (params: string[], body: ts.ConciseBody) => {
    return ts.createArrowFunction(undefined, undefined,
        params.map(item => ts.createParameter(undefined, undefined, undefined, item, undefined, undefined, undefined)),
        undefined, undefined, body
    );
};

export const cAccess = (...callPath: string[]) => {
    let identifier: ts.Expression = ts.createIdentifier(callPath[0]);
    for (let i = 1; i < callPath.length; i++) {
        identifier = ts.createPropertyAccess(identifier, callPath[i]);
    }
    return identifier;
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
    return ts.createObjectLiteral(Object.entries(properties).map(([name, value]) => {
        return ts.createPropertyAssignment(name, cLiteralAst(value, options));
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
        (res as any).singleQuote = options.useSingleQuates;
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

export interface ClassProperty {
    name: string;
    isPublic: boolean;
    isStatic: boolean;
    initializer: ts.Expression;
}

export interface ClassConstructor {
    params: string[];
    statements: ts.Statement[];
}

export const cClass = (name: string, extendz: string | ts.Expression | undefined, constructorInfo: ClassConstructor | undefined, properties: ClassProperty[]) => {
    const memebersAst: ts.ClassElement[] = properties.map(prop => {
        const modifiers: ts.Modifier[] = [];
        if (prop.isPublic) {
            modifiers.push(ts.createModifier(ts.SyntaxKind.PublicKeyword));
        } else {
            modifiers.push(ts.createModifier(ts.SyntaxKind.PrivateKeyword));
        }

        if (prop.isStatic) {
            modifiers.push(ts.createModifier(ts.SyntaxKind.StaticKeyword));
        }

        return ts.createProperty(
            undefined,
            modifiers,
            ts.createIdentifier(prop.name),
            undefined,
            undefined,
            prop.initializer
        );
    });
    const allMembers = constructorInfo ? [
        ts.createConstructor(undefined, undefined, cParams(constructorInfo.params), ts.createBlock(constructorInfo.statements)) as ts.ClassElement
    ].concat(memebersAst) : memebersAst;
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


export interface ImportSpecifierInfo {
    localName?: string;
    importedName: string;
}
export interface IImportInfo {
    modulePath: string;
    exports: ImportSpecifierInfo[];
    defaultLocalName?: string;
}
export const cImport = (info: IImportInfo) => {
    return ts.createImportDeclaration(undefined, undefined,
        ts.createImportClause(
            info.defaultLocalName ? ts.createIdentifier(info.defaultLocalName) : undefined,
            info.exports.length ? ts.createNamedImports(info.exports.map(exp => ts.createImportSpecifier(exp.localName ? ts.createIdentifier(exp.importedName) : undefined, exp.localName ? ts.createIdentifier(exp.localName) : ts.createIdentifier(exp.importedName)))) : undefined
        ), cLiteralAst(info.modulePath));
};

export const createChangeBitMask = (names: string[]) => {
    return cObject(names.reduce((accum, name, currentIndex) => {
        accum[name] = ts.createBinary(ts.createNumericLiteral((currentIndex + 1).toString()), ts.SyntaxKind.LessThanLessThanToken, ts.createNumericLiteral('0'));
        return accum;
    }, {} as any));
};

export const createBitWiseOr = (maskPath: string[], names: string[]) => {
    let res: ts.Expression = cAccess(...maskPath, names[0]);
    for (let i = 1; i < names.length; i++) {
        res = ts.createBinary(res, ts.SyntaxKind.FirstBinaryOperator, cAccess(...maskPath, names[i]));
    }
    return res;
};

export interface CBitMaskIfOptions {
    changedMaskName: string;
    maskPath: string[];
}
const defaultCBitMaskIfOptions: CBitMaskIfOptions = {
    changedMaskName: 'changeMap',
    maskPath: []
};
export const cBitMaskIf = (checkedFlag: string, options: CBitMaskIfOptions = defaultCBitMaskIfOptions, statements: ts.Statement[]) => {
    return CIf(ts.createBinary(

        ts.createIdentifier(options.changedMaskName),
        ts.createToken(ts.SyntaxKind.AmpersandToken),
        cAccess(...options.maskPath, checkedFlag)
    ), statements);
};

export const CIf = (condition: ts.Expression, statements: ts.Statement[]) => {
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

export const generateHydrate = (_node: JsxRoot, parentComp: CompDefinition, domBindings: DomBinding[]) => {

    const body = cNew([parentComp.name!], [
        cObject(domBindings.reduce((accum, item) => {
            accum[item.ctxName] = cloneDeep(parseValue(item.viewLocator));
            return accum;
        }, { root: ts.createIdentifier('root') } as any)),
        ts.createIdentifier('props')
    ]);
    return cArrow(['root', parentComp.propsIdentifier || 'props'], body);
};