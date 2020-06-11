import { getComponentTag } from '../../visitors/jsx';
import { asSourceFile } from '../parser';
import { asCode, cloneDeep } from '../..';
import flatMap from 'lodash/flatMap';
import ts, { JsxAttribute, JsxElement } from 'typescript';
import { nativeAttributeMapping } from './native-attribute-mapping';
import last from 'lodash/last';
import repeat from 'lodash/repeat';
import isString from 'lodash/isString';

export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

type PossibleReplacement = ts.Node | Replacement | false;
type Replacement = ExpressionData | string;
export type AstNodeReplacer = (node: ts.Node) => PossibleReplacement;

export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: AstNodeReplacer[]) => {
    jsx = asSourceFile(asCode(jsx), 'placeholder.ts').statements[0].expression as JsxElement;
    const joinedRes = toExpTextTuples(jsx, replacers, 0);

    if (joinedRes.length === 1) {
        return ts.createNoSubstitutionTemplateLiteral(joinedRes[0].text);
    }
    const tail = joinedRes.pop()!;
    const head = joinedRes.shift()!;
    const spans = joinedRes.map(({ expression, text }) =>
        ts.createTemplateSpan(expression, ts.createTemplateMiddle(text))
    );
    spans.push(ts.createTemplateSpan(tail?.expression, ts.createTemplateTail(tail.text)));

    return cloneDeep(ts.createTemplateExpression(ts.createTemplateHead(head.text), spans));
};

const toExpTextTuples = (
    jsx: ts.JsxElement | ts.JsxSelfClosingElement,
    replacers: AstNodeReplacer[],
    leadingTriviaWidth: number
) => {
    const parts = nodeToStringParts(jsx, replacers, leadingTriviaWidth);
    const flattened = flatMap(parts, item => 
        typeof item === 'string' ? [item] : [item.prefix || '', item.expression, item.suffix || '']
    );
    const res: Array<{ expression: ts.Expression; textFragments: string[] }> = [
        {
            expression: null!, // the head is always text-only
            textFragments: []
        }
    ];
    for (const item of flattened) {
        if (typeof item === 'string') {
            last(res)!.textFragments.push(item);
        } else {
            if (item)
            res.push({
                expression: item,
                textFragments: []
            });
        }
    }
    return res.map(({ expression, textFragments: text }) => ({ expression, text: text.join('') }));
};

export function nodeToStringParts(
    node: ts.Node,
    replacers: AstNodeReplacer[],
    leadingTriviaWidth: number
): Replacement[] {
    let replaced: PossibleReplacement = false;
    replacers.find(r => (replaced = r(node)) !== false);
    if (replaced !== false) {
        if (ts.isJsxElement(replaced)) {
            replaced = asSourceFile(asCode(replaced));
            (replaced as any).src = (node as any).src || node;
            const ret = nodeToStringParts(replaced, replacers, 0);
            return ret;
        }
        return [replaced];
    }
    if (node.getChildCount() > 0) {
        const ch = flatMap(node.getChildren(), child => nodeToStringParts(child, replacers, 0));
        return ch;
    }

    return [node.getFullText()];
}

export const jsxAttributeReplacer: AstNodeReplacer = node =>
    ts.isJsxExpression(node) &&
    ts.isJsxAttribute(node.parent) && {
        prefix: '"',
        expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
        suffix: '"'
    };


export const jsxEventHandlerRemover: AstNodeReplacer = node => {
    if (ts.isJsxAttribute(node)) {
        return asCode(node.name).match(/^on[A-Z].*/) ? '' : false;
    }
    return false;
};

export const jsxAttributeNameReplacer: AstNodeReplacer = node => {
    if (
        ts.isIdentifier(node) &&
        node.parent &&
        ts.isJsxAttribute(node.parent) &&
        !getComponentTag(node.parent.parent.parent.parent)
    ) {
        const attrName = asCode(node);
        const replacement = nativeAttributeMapping[attrName];
        return ' ' + (replacement || attrName);
    }
    return false;
};

export const jsxSelfClosingElementReplacer: AstNodeReplacer = node => {
    if (ts.isJsxSelfClosingElement(node)) {
        return cloneDeep(
            ts.createJsxElement(
                ts.createJsxOpeningElement(node.tagName, undefined, cloneDeep(node.attributes)),
                [],
                ts.createJsxClosingElement(node.tagName)
            ),
            node.parent
        );
    } else {
        return false;
    }
};

export const isComponentTag = (tag: ts.JsxTagNameExpression | string) => {
    const text = isString(tag) ? tag : asCode(tag);
    return /^([a-zA-z0-9$_]+\.)*([A-Z][a-zA-z0-9$_]*)$/.test(text);
};
