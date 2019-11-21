import ts, { JsxSelfClosingElement } from 'typescript';
import { JsxRoot, CompDefinition } from '../../analyzers/types';
import { cArrow, cloneDeep, cCall, cObject } from './ast-generators';

export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

export interface AstNodeReplacer<T extends ts.Node = ts.Node> {
    shouldReplace: (node: ts.Node) => node is T;
    transform: (node: T) => ExpressionData;
}
export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: Array<AstNodeReplacer<any>>) => {
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

export function nodeToStringParts(node: ts.Node, replacers: AstNodeReplacer[]) {
    const resArr: Array<string | ExpressionData> = [];
    const replacer = replacers.find(r => r.shouldReplace(node));
    if (replacer) {
        return [replacer.transform(node)];
    }
    if (node.getChildCount() > 0) {
        for (const child of node.getChildren()) {
            resArr.push(...nodeToStringParts(child, replacers));
        }
        return resArr;
    }
    return [node.getFullText()];
}


export const jsxAttributeReplacer: AstNodeReplacer<ts.JsxExpression> = {
    shouldReplace(node): node is ts.JsxExpression {
        return ts.isJsxExpression(node) && ts.isJsxAttribute(node.parent);
    },
    transform(node) {
        return {
            prefix: '"',
            expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
            suffix: '"'
        };
    }
};

export const jsxTextExpressionReplacer: AstNodeReplacer<ts.JsxExpression> = {
    shouldReplace(node): node is ts.JsxExpression {
        return ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent);
    },
    transform(node) {
        return {
            prefix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`,
            expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
            suffix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`
        };
    }
};

export const jsxComponentReplacer: AstNodeReplacer<ts.JsxElement | JsxSelfClosingElement> = {
    shouldReplace(node): node is ts.JsxElement | JsxSelfClosingElement {
        if (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) {
            return true;
        }
        if (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName)) {
            return true;
        }
        return false;
    },
    transform(node) {
        const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = openingNode.tagName.getText();

        return {
            expression: cCall([tagName, 'factory', 'toString'],
                [
                    cObject(openingNode.attributes.properties.reduce((accum, prop) => {
                        if (ts.isJsxSpreadAttribute(prop)) {
                            throw new Error('spread in attributes is not handled yet');
                        }
                        const initializer = prop.initializer;
                        if (!initializer) {
                            accum[prop.name.getText()] = ts.createTrue();
                        } else if (ts.isJsxExpression(initializer)) {
                            if (initializer.expression) {
                                accum[prop.name.getText()] = cloneDeep(initializer.expression);
                            }
                        } else {
                            accum[prop.name.getText()] = cloneDeep(initializer);
                        }
                        return accum;
                    }, {} as Record<string, any>))
                ]),
        };
    }
};



export const isComponentTag = (node: ts.JsxTagNameExpression) => {
    const text = node.getText();
    return text[0].toLowerCase() !== text[0] || text.indexOf('.') !== -1;
};

export const generateToString = (node: JsxRoot, parentComp: CompDefinition) => {
    return cArrow([parentComp.propsIdentifier || 'props'],
        jsxToStringTemplate(node.sourceAstNode, [
            jsxComponentReplacer,
            jsxTextExpressionReplacer,
            jsxAttributeReplacer
        ]));
};
