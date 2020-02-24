import { getComponentTag } from '../../visitors/jsx';
import { asSourceFile } from '../parser';
import { printAstText, cloneDeep } from '../..';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import { nativeAttributeMapping } from './native-attribute-mapping';
import last from 'lodash/last';
import repeat from 'lodash/repeat';

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
    const leadingTriviaWidth = jsx.getLeadingTriviaWidth();
    const joinedRes = toExpTextTuples(jsx, replacers, leadingTriviaWidth);
    joinedRes[0].text = joinedRes[0].text.slice(leadingTriviaWidth);

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

const toExpTextTuples = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: AstNodeReplacer[], leadingTriviaWidth: number) => {
    const parts = nodeToStringParts(jsx, replacers, leadingTriviaWidth);
    const flattened = flatMap(parts,
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

export function nodeToStringParts(node: ts.Node, replacers: AstNodeReplacer[], leadingTriviaWidth: number): Replacement[] {
    let replaced: PossibleReplacement = false;
    replacers.find(r => (replaced = r(node)) !== false);
    if (replaced !== false) {
        if (ts.isJsxElement(replaced)) {
            replaced = asSourceFile(repeat(' ', leadingTriviaWidth) + printAstText(replaced));
            const ret = nodeToStringParts(replaced, replacers, 0);
            return ret;
        }
        return [replaced];
    }
    if (node.getChildCount() > 0) {
        return flatMap(node.getChildren(),
            child => nodeToStringParts(child, replacers, 0));
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
        if (ts.isJsxAttribute(node)) {
            return printAstText(node.name).match(/^on[A-Z].*/)
                ? ''
                : false;
        }
        return false;
    };

export const jsxAttributeNameReplacer: AstNodeReplacer =
    node => {
        if (ts.isIdentifier(node) && node.parent && ts.isJsxAttribute(node.parent)
            && !getComponentTag(node.parent.parent.parent.parent)
        ) {
            const attrName = printAstText(node);
            const replacement = nativeAttributeMapping[attrName];
            return ' ' + (replacement || attrName);
        }
        return false;
    };

export const jsxSelfClosingElementReplacer: AstNodeReplacer = node => {
    if (ts.isJsxSelfClosingElement(node)) {
        return cloneDeep(ts.createJsxElement(
            ts.createJsxOpeningElement(node.tagName,
                undefined,
                cloneDeep(node.attributes)
            ), [], ts.createJsxClosingElement(node.tagName)
        ), node.parent);
    } else {
        return false;
    }
};

export const isComponentTag = (node: ts.JsxTagNameExpression) => {
    const text = printAstText(node);
    return text[0].toLowerCase() !== text[0] || text.indexOf('.') !== -1;
};
