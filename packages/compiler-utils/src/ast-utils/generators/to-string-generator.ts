import { getComponentTag } from '../../visitors/jsx';
import { asSourceFile, asAst } from '../parser';
import { asCode, cloneDeep } from '../..';
import flatMap from 'lodash/flatMap';
import ts, { visitNode } from 'typescript';
import { nativeAttributeMapping } from './native-attribute-mapping';
import last from 'lodash/last';
import isString from 'lodash/isString';

export interface ExpressionData {
    expression: ts.Expression;
    prefix?: string;
    suffix?: string;
}

type PossibleReplacement = ts.Node | Replacement | false;
type Replacement = ExpressionData | string;
export type AstNodeReplacer = (node: ts.Node, p: ts.Node) => ts.Node | undefined;

export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: AstNodeReplacer[]) => {
    let replaced = jsx;
    for (const replacer of replacers) {
        replaced = cloneDeep(replaced, undefined, replacer) as ts.JsxElement;
    }
    type Exp = { exp: ts.Expression };
    const chunks: [string, ...(Exp | string)[]] = [''];
    const add = (val: Exp | string) => {
        if (typeof val === 'string') {
            if (typeof last(chunks) === 'string') {
                chunks[chunks.length - 1] = chunks[chunks.length - 1] + val;
            } else {
                chunks.push(val);
            }
        } else {
            chunks.push(val);
        }
    }


    const visitor = n => {
        const src = n?.src || n;
        if (ts.isJsxOpeningElement(src) || ts.isJsxSelfClosingElement(src)) {
            const tag = asCode(src.tagName);
            if (isComponentTag(tag)) {
                add('<!--C-->');
                const exp = asAst(`TSXAir.runtime.toString(${asCode(n)})`) as ts.Expression;
                exp.src = src;
                add({ exp });
                add('<!--C-->');
                return ts.createTrue();
            } else {
                if (true) {
                    add(`<${asCode(n.tagName)}`);
                    n.attributes.properties.forEach((attr) => {
                        if (!ts.isJsxAttribute(attr)) throw new Error('Invalid attribute');
                        const { name, initializer } = attr;
                        const attrName = asCode(name);
                        if (!/on[A-Z].*/.test(attrName)) {
                            add(` ${attrName === 'className' ? 'class' : attrName}`);
                            if (initializer) {
                                if (ts.isJsxExpression(initializer)) {
                                    add('="');
                                    if (initializer.expression) {
                                        add({ exp: initializer.expression })
                                    }
                                    add('"');
                                } else {
                                    add(`=${asCode(initializer)}`);
                                }
                            }
                        }
                    });
                    add(`>`);
                    if (ts.isJsxSelfClosingElement(n)) {
                        add(`</${tag}>`);
                    }
                }
            }
        }
        if (ts.isJsxExpression(n) && !ts.isJsxAttribute(n.parent) && n.expression) {
            add('<!--X-->');
            add({ exp: asAst(`TSXAir.runtime.toString(${asCode(n.expression)})`) as ts.Expression });
            add('<!--X-->');
            return ts.createTrue();
        }
        if (ts.isJsxClosingElement(n)) {
            const tag = asCode(src.tagName);
            if (!isComponentTag(tag)) {
                add(`</${tag}>`);
            }
        }
        if (ts.isJsxText(n)) {
            add(asCode(n));
        }
        return undefined;
    };

    cloneDeep(replaced, undefined, visitor);
    if (chunks.length === 1) {
        return ts.createNoSubstitutionTemplateLiteral(chunks[0]);
    }
    const head = chunks.shift() as string;
    const spans: ts.TemplateSpan[] = [];
    chunks.forEach((ch, i) => {
        if (typeof ch !== 'string') {
            const isLast = i >= chunks.length - 2;
            spans.push(ts.createTemplateSpan(ch.exp,
                isLast
                    ? ts.createTemplateTail(chunks[i + 1] as string)
                    : ts.createTemplateMiddle(chunks[i + 1] as string))
            );
        }
    })

    return cloneDeep(ts.createTemplateExpression(ts.createTemplateHead(head), spans));
};

export const __jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: AstNodeReplacer[]) => {
    const clone = asSourceFile(asCode(jsx), 'placeholder.ts').statements[0].expression as ts.JsxElement;
    const nodes: ts.Node[] = []
    const nodes2: ts.Node[] = []
    cloneDeep(jsx, undefined, n => (nodes.push(n), undefined));
    cloneDeep(clone, undefined, n => (nodes2.push(n), undefined));
    // while (!(ts.isJsxElement(nodes[0]) || ts.isJsxSelfClosingElement(nodes[0]))) {
    //     nodes.shift();
    // }
    // cloneDeep(clone, undefined, n => {
    //     nodes2[0] = nodes2[0];
    //     (n as any).src = nodes.shift();
    //     return undefined;
    // });
    nodes2.forEach((n, i) => n.src = nodes[i]);
    const joinedRes = toExpTextTuples(clone, replacers);

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
    replacers: AstNodeReplacer[]
) => {
    const parts = nodeToStringParts(jsx, replacers);
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
    replacers: AstNodeReplacer[]): Replacement[] {
    let replaced: PossibleReplacement = false;
    replacers.find(r => (replaced = r(node)) !== false);
    if (replaced !== false) {
        if (ts.isJsxElement(replaced)) {
            replaced = asSourceFile(asCode(replaced)).statements[0];
            (replaced as any).src = (node as any).src || node;
            const ret = nodeToStringParts(replaced, replacers);
            ret.src = node;
            return ret;
        }
        // replaced.src = node;
        return [replaced];
    }
    if (node.getChildCount() > 0) {
        const ch = flatMap(node.getChildren(), child => nodeToStringParts(child, replacers));
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
        const r = cloneDeep(
            ts.createJsxElement(
                ts.createJsxOpeningElement(node.tagName, undefined, cloneDeep(node.attributes)),
                [],
                ts.createJsxClosingElement(node.tagName)
            ),
            node.parent
        );
        r.src = node?.src || node;
        return r;
    } else {
        return false;
    }
};

export const isComponentTag = (tag: ts.JsxTagNameExpression | string) => {
    const text = isString(tag) ? tag : asCode(tag);
    return /^([a-zA-z0-9$_]+\.)*([A-Z][a-zA-z0-9$_]*)$/.test(text);
};
