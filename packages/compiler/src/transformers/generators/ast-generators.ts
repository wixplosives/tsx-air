// tslint:disable: no-bitwise

import ts, { JsxSelfClosingElement, createArrayBindingPattern } from 'typescript';
import { isArray } from 'util';
export const cArrow = (body: ts.ConciseBody, ...params: string[]) => {
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
export const cObject = (properties: Record<string, any>) => {
    return ts.createObjectLiteral(Object.entries(properties).map(([name, value]) => {
        return ts.createPropertyAssignment(name, cLiteralAst(value));
    }));
};

export const cArray = (items: any[]) => {
    return ts.createArrayLiteral(items.map(cLiteralAst));
};

export function cLiteralAst(item: any): ts.Expression {
    const exp = isTSNode(item) ? item :
        isArray(item) ? cArray(item) :
            (typeof item === 'object') ? cObject(item) :
                cPrimitive(item);

    if (exp === null) {
        throw new Error('unknown conversion');
    }
    return exp as ts.Expression;
}

export function isTSNode(node: any): node is ts.Node {
    return node && !!node.kind;
}

export const cPrimitive = (input: any) => {
    if (typeof input === 'string') {
        return ts.createStringLiteral(input);
    }
    if (typeof input === 'number') {
        return ts.createNumericLiteral(input.toString());
    }
    if (typeof input === 'boolean') {
        return input ? ts.createTrue() : ts.createFalse();
    }
    return null;
};

export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

export interface ExpressionReplacer<T extends ts.Node = ts.Node> {
    isApplicable: (node: ts.Node) => node is T;
    getExpression: (node: T) => ExpressionData;
}
export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: Array<ExpressionReplacer<any>>) => {
    const res = nodeToStringParts(jsx, replacers);
    const flattened = res.reduce((accum, item) => {
        if (typeof item === 'string') {
            accum.push(item);
        } else {
            if (item.prefix) {
                accum.push(item.prefix);
            }
            accum.push(item.expression);
            if (item.suffix) {
                accum.push(item.suffix);
            }
        }
        return accum;
    }, [] as Array<string | ts.Expression>);
    const joinedRes = joinStrings(flattened);
    if (typeof joinedRes[0] !== 'string') {
        throw new Error(('node to string failed'));
    }
    joinedRes[0] = joinedRes[0].slice(jsx.getLeadingTriviaWidth());
    if (joinedRes.length === 1) {
        return ts.createNoSubstitutionTemplateLiteral(joinedRes[0] as string);
    }
    return ts.createTemplateExpression(
        ts.createTemplateHead(joinedRes.shift() as string),
        joinedRes.reduce((accum, item) => {
            if (typeof item === 'string') {
                last(accum).txt += item;
            } else {
                accum.push({
                    exp: item,
                    txt: ''
                });
            }

            // return ts.createTemplateSpan(item, ts.createTemplateMiddle(''))
            return accum;
        }, [] as Array<{
            exp: ts.Expression,
            txt: string
        }>).map((item, idx, arr) => ts.createTemplateSpan(item.exp, idx === arr.length - 1 ? ts.createTemplateTail(item.txt) : ts.createTemplateMiddle(item.txt)))
    );
};

export const joinStrings = <T>(arr: Array<string | T>) => {
    const res: Array<string | T> = [];
    for (const item of arr) {
        if (typeof item === 'string' && typeof last(res) === 'string') {
            res.push((res.pop() as string) + item);
        } else {
            res.push(item);
        }
    }
    return res;
};

export const last = <T>(arr: T[]) => {
    return arr[arr.length - 1];
};

export function nodeToStringParts(node: ts.Node, replacers: ExpressionReplacer[]) {
    const resArr: Array<string | ExpressionData> = [];
    const replacer = replacers.find(r => r.isApplicable(node));
    if (replacer) {
        return [replacer.getExpression(node)];
    }
    if (node.getChildCount() > 0) {
        for (const child of node.getChildren()) {
            resArr.push(...nodeToStringParts(child, replacers));
        }
        return resArr;
    }
    return [node.getFullText()];
}

function createSynthesizedNode(kind: ts.SyntaxKind) {
    const node = ts.createNode(kind, -1, -1);
    node.flags |= 8 /* Synthesized */;
    return node;
}



export const cloneDeep = <T extends ts.Node>(node: T) => {
    const clone = createSynthesizedNode(node.kind) as T;
    for (const key in node) {
        if (clone.hasOwnProperty(key) || !node.hasOwnProperty(key)) {
            continue;
        }
        if (node[key] && (node[key] as any).kind) {
            clone[key] = (cloneDeep(node[key] as any as ts.Node) as any);
        } else if (node[key] && (node[key] as any).length && (node[key] as any)[0].kind) {
            clone[key] = (node[key] as any as ts.Node[]).map(item => cloneDeep(item)) as any;
        } else {
            clone[key] = node[key];
        }
    }
    return clone;

};

export const attributeReplacer: ExpressionReplacer<ts.JsxExpression> = {
    isApplicable(node): node is ts.JsxExpression {
        return ts.isJsxExpression(node) && ts.isJsxAttribute(node.parent);
    },
    getExpression(node) {
        return {
            prefix: '"',
            expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
            suffix: '"'
        };
    }
};

export const jsxTextExpressionReplacer: ExpressionReplacer<ts.JsxExpression> = {
    isApplicable(node): node is ts.JsxExpression {
        return ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent);
    },
    getExpression(node) {
        return {
            prefix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`,
            expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
            suffix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`
        };
    }
};

export const jsxComponentReplacer: ExpressionReplacer<ts.JsxElement | JsxSelfClosingElement> = {
    isApplicable(node): node is ts.JsxElement | JsxSelfClosingElement {
        if (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) {
            return true;
        }
        if (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName)) {
            return true;
        }
        return false;
    },
    getExpression(node) {
        const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = openingNode.tagName.getText();

        return {
            expression: cCall([tagName, 'toString'],
                [cObject(openingNode.attributes.properties.reduce((accum, prop) => {
                    if (ts.isJsxSpreadAttribute(prop)) {
                        throw new Error('spread in attributes is not handled yet');
                    }
                    accum[prop.name.getText()] = prop.initializer ? cloneDeep(prop.initializer) : ts.createTrue();
                    return accum;
                }, {} as Record<string, any>))]),
        };
    }
};

export const isComponentTag = (node: ts.JsxTagNameExpression) => {
    const text = node.getText();
    return text[0].toLowerCase() !== text[0] || text.indexOf('.') !== -1;
};