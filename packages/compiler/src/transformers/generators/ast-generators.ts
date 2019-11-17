import ts from 'typescript';
import { isArray } from 'util';
import { JsxRoot, CompDefinition } from '../../analyzers/types';
import { generateDomBindings } from './component-common';
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


export const cCall = (callPath: string[], args: ts.Expression[]) => {
    let identifier: ts.Expression = ts.createIdentifier(callPath[0]);
    for (let i = 1; i < callPath.length; i++) {
        identifier = ts.createPropertyAccess(identifier, callPath[i]);
    }

    return ts.createCall(identifier, undefined, args);
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

export const generateHydrate = (_node: JsxRoot, parentComp: CompDefinition) => {
    const hydratableParts = generateDomBindings(parentComp);

    return cArrow([parentComp.propsIdentifier || 'props'], cObject(hydratableParts.reduce((accum, item) => {
        accum[item.ctxName] = cloneDeep(parseValue(item.viewLocator));
        return accum;
    }, {} as any)));
};