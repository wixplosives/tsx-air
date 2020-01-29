import flatMap from 'lodash/flatMap';
import ts, { JsxSelfClosingElement } from 'typescript';
import { cloneDeep, cCall, cObject } from './ast-generators';
import { nativeAttributeMapping, isJSXHTMLAttribute } from './native-attribute-mapping';

export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

type PossibleReplacement = Replacement | false;
type Replacement = ExpressionData | string;
export type AstNodeReplacer<T extends ts.Node = ts.Node> =
    (node: T) => PossibleReplacement;

export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: Array<AstNodeReplacer<any>>) => {
    const flattened = flatMap(nodeToStringParts(jsx, replacers),
        item => typeof item === 'string'
            ? [item]
            : [item.prefix || '', item.expression, item.suffix || '']
    );
    const joinedRes = toExpTextTuples(flattened);
    joinedRes[0].text = joinedRes[0].text.slice(jsx.getLeadingTriviaWidth());

    if (joinedRes.length === 1) {
        return ts.createNoSubstitutionTemplateLiteral(joinedRes[0].text);
    }
    const tail = joinedRes.pop()!;
    const head = joinedRes.shift()!;
    const spans = joinedRes.map(({expression, text}) => 
        ts.createTemplateSpan(expression, ts.createTemplateMiddle(text)));
    spans.push(ts.createTemplateSpan(tail?.expression, ts.createTemplateTail(tail.text)));

    return ts.createTemplateExpression(
        ts.createTemplateHead(head.text),
        spans
    );
};

const toExpTextTuples = (arr: Array<string | ts.Expression>) => {
    const res: Array<{expression:ts.Expression, text:string}> = [{
        expression: null!, 
        text: ''
    }];
    for (const item of arr) {
        if (typeof item === 'string') {
            last(res).text = last(res).text + item; 
        } else {
            res.push({
                expression: item,
                text: ''
            });
        }
    }    
    return res;
};

export const last = <T>(arr: T[]) => {
    return arr[arr.length - 1];
};

export function nodeToStringParts(node: ts.Node, replacers: AstNodeReplacer[]): Replacement[] {
    let replaced: PossibleReplacement = false;
    replacers.find(r => (replaced = r(node)) !== false);
    if (replaced !== false) {
        return [replaced];
    }
    if (node.getChildCount() > 0) {
        return flatMap(node.getChildren(),
            child => nodeToStringParts(child, replacers));
    }
    return [node.getFullText()];
}


export const jsxAttributeReplacer: AstNodeReplacer<ts.JsxExpression> =
    node =>
        ts.isJsxExpression(node) && ts.isJsxAttribute(node.parent) &&
        {
            prefix: '"',
            expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
            suffix: '"'
        };

export const jsxAttributeNameReplacer: AstNodeReplacer<ts.Identifier> =
    node => {
        if (ts.isIdentifier(node) &&
            ts.isJsxAttribute(node.parent) &&
            !isComponentTag((node.parent.parent.parent as JsxSelfClosingElement).tagName) &&
            !!nativeAttributeMapping[node.getText()]) {
            const mapping = nativeAttributeMapping[node.getText()];
            if (isJSXHTMLAttribute(mapping)) {
                return ' ' + mapping.htmlName;
            }
            return ' ' + node.getText();
        }
        return false;
    };

export const jsxTextExpressionReplacer: AstNodeReplacer<ts.JsxExpression> =
    node => ts.isJsxExpression(node) &&
        !ts.isJsxAttribute(node.parent) &&
    {
        prefix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`,
        expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
        suffix: `<!-- ${node.expression ? node.expression.getText() : 'empty expression'} -->`
    };

export const jsxComponentReplacer: AstNodeReplacer<ts.JsxElement | JsxSelfClosingElement> =
    node => {
        if ((ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
            (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))) {
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
        return false;
    };



export const isComponentTag = (node: ts.JsxTagNameExpression) => {
    const text = node.getText();
    return text[0].toLowerCase() !== text[0] || text.indexOf('.') !== -1;
};


