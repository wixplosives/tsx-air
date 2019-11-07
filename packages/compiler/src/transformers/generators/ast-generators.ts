// tslint:disable: no-bitwise

import ts from 'typescript';
export const cArrow = (body: ts.ConciseBody, ...params: string[]) => {
    return ts.createArrowFunction(undefined, undefined,
        params.map(item => ts.createParameter(undefined, undefined, undefined, item, undefined, undefined, undefined)),
        undefined, undefined, body
    );
};


export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

export interface ExpressionReplacer {
    isApplicable: (node: ts.Node) => boolean;
    getExpression: (node: ts.Node) => ExpressionData;
}
export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: ExpressionReplacer[]) => {
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