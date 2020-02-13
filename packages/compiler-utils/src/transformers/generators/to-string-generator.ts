import { printAst } from './../../dev-utils/print-ast';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import { cloneDeep } from './ast-generators';
import { nativeAttributeMapping, isJsxHtmlAttribute } from './native-attribute-mapping';
import last from 'lodash/last';
import { parseValue } from '../../ast-utils/parser';

export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

type PossibleReplacement = ts.Node | Replacement | false;
type Replacement = ExpressionData | string;
export type AstNodeReplacer =
    (node: ts.Node) => PossibleReplacement;

export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: AstNodeReplacer[]) => {
    const joinedRes = toExpTextTuples(jsx, replacers);
    joinedRes[0].text = joinedRes[0].text.slice(jsx.getLeadingTriviaWidth());

    if (joinedRes.length === 1) {
        return ts.createNoSubstitutionTemplateLiteral(joinedRes[0].text);
    }
    const tail = joinedRes.pop()!;
    const head = joinedRes.shift()!;
    const spans = joinedRes.map(({ expression, text }) =>
        ts.createTemplateSpan(expression, ts.createTemplateMiddle(text)));
    spans.push(ts.createTemplateSpan(tail?.expression, ts.createTemplateTail(tail.text)));

    return ts.createTemplateExpression(
        ts.createTemplateHead(head.text),
        spans
    );
};

const toExpTextTuples = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: AstNodeReplacer[]) => {
    const flattened = flatMap(nodeToStringParts(jsx, replacers),
        item => typeof item === 'string'
            ? [item]
            : [item.prefix || '', item.expression, item.suffix || '']
    );
    const res: Array<{ expression: ts.Expression, textFragments: string[] }> = [{
        expression: null!, // the head is always text-only
        textFragments: []
    }];
    for (const item of flattened) {
        if (typeof item === 'string') {
            last(res)!.textFragments.push(item);
        } else {
            res.push({
                expression: item,
                textFragments: []
            });
        }
    }
    return res.map(({ expression, textFragments: text }) => ({ expression, text: text.join('') }));
};

export function nodeToStringParts(node: ts.Node, replacers: AstNodeReplacer[]): Replacement[] {
    let replaced: PossibleReplacement = false;
    replacers.find(r => (replaced = r(node)) !== false);
    if (replaced !== false) {
        if (ts.isJsxElement(replaced)) {
            return nodeToStringParts(replaced, replacers);
        }
        return [replaced];
    }
    if (node.getChildCount() > 0) {
        return flatMap(node.getChildren(),
            child => nodeToStringParts(child, replacers));
    }
    return [node.getFullText()];
}


export const jsxAttributeReplacer: AstNodeReplacer =
    node =>
        ts.isJsxExpression(node) && ts.isJsxAttribute(node.parent) &&
        {
            prefix: '"',
            expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
            suffix: '"'
        };

export const jsxEventHandlerRemover: AstNodeReplacer = 
    node => {
        return ts.isJsxAttribute(node) &&
        node.name.getText().match(/^on[A-Z].*/) 
        ? ''
        : false;
    }

export const jsxAttributeNameReplacer: AstNodeReplacer =
    node => {
        if (ts.isIdentifier(node) &&
            ts.isJsxAttribute(node.parent) &&
            !isComponentTag((node.parent.parent.parent as ts.JsxSelfClosingElement).tagName) &&
            !!nativeAttributeMapping[node.getText()]) {
            const mapping = nativeAttributeMapping[node.getText()];
            if (isJsxHtmlAttribute(mapping)) {
                return ' ' + mapping.htmlName;
            }
            return ' ' + node.getText();
        }
        return false;
    };

export const jsxSelfClosingElementReplacer: AstNodeReplacer = node => {
    if (ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText();
        const p = node.getFullText().replace(/\s*\/\>$/, `></${tag}>`);
        return parseValue(p.replace(/^ /,''));
    } else {
        return false;
    }
};

export const isComponentTag = (node: ts.JsxTagNameExpression) => {
    const text = node.getText();
    return text[0].toLowerCase() !== text[0] || text.indexOf('.') !== -1;
};
