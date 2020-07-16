import { setupClosure } from '../helpers';
import {
    cMethod,
    astTemplate,
    cloneDeep,
    asCode,
    asAst,
    Modifier,
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { swapVirtualElements } from '../function';
import { FragmentData } from './jsx.fragment';
import last from 'lodash/last';
import { isComponentTag } from '@tsx-air/utils';
import { merge } from 'lodash';


export const generateToString = (fragment: FragmentData) => {
    const { comp, allFragments: fragments, root } = fragment;

    const template =
        jsxToStringTemplate(root.sourceAstNode, [
            n => n !== root.sourceAstNode
                ? swapVirtualElements(comp, fragments, n, true)
                : undefined,
            (n: ts.Node) => {
                if (ts.isJsxAttributes(n) && n.properties.some(
                    a => ts.isJsxAttribute(a)
                        && a.initializer && ts.isJsxExpression(a.initializer))) {
                    return ts.createJsxAttributes([...n.properties.map(p => cloneDeep(p)),
                    ts.createJsxAttribute(ts.createIdentifier('x-da'), ts.createStringLiteral('!'))]);
                }
                return undefined;
            }
        ]);

    const vars = merge({}, ...fragment.root.expressions.map(e => e.aggregatedVariables));
    return cMethod('toString', [], [
        ...setupClosure(comp, vars, true),
        ts.createReturn(
            astTemplate(`this.unique(template)`, { template }) as any as ts.Expression
        )]);
};

export const jsxToStringTemplate = (jsx: ts.JsxElement | ts.JsxSelfClosingElement, replacers: Array<Modifier<any>>) => {
    let replaced = jsx;
    for (const replacer of replacers) {
        replaced = cloneDeep(replaced, undefined, replacer) as ts.JsxElement;
    }
    interface Exp { exp: ts.Expression; }
    const chunks: [string, ...Array<Exp | string>] = [''];
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
    };

    const visitor = (n: ts.Node) => {
        // @ts-ignore
        const src = n?.src || n;
        if (ts.isJsxOpeningElement(src) || ts.isJsxSelfClosingElement(src)) {
            const tag = asCode(src.tagName);
            if (isComponentTag(tag)) {
                add('<!--C-->');
                const exp = asAst(`this.$rt.toString(${asCode(n)})`) as ts.Expression;
                // @ts-ignore
                exp.src = src;
                add({ exp });
                add('<!--C-->');
                return ts.createTrue();
            } else {
                if (true) {
                    const nn = n as ts.JsxOpeningElement;
                    add(`<${asCode(nn.tagName)}`);
                    nn.attributes.properties.forEach((attr: ts.JsxAttributeLike) => {
                        if (!ts.isJsxAttribute(attr)) { throw new Error('Invalid attribute'); }
                        const { name, initializer } = attr;
                        const attrName = asCode(name);
                        if (!/on[A-Z].*|ref/.test(attrName)) {
                            add(` ${attrName === 'className' ? 'class' : attrName}`);
                            if (initializer) {
                                if (ts.isJsxExpression(initializer)) {
                                    add('="');
                                    if (initializer.expression) {
                                        if (attrName === 'style') {
                                            add({ exp: astTemplate(`this.$rt.spreadStyle(exp)`, { exp: initializer.expression }) as any as ts.Expression });
                                        } else {
                                            add({ exp: initializer.expression });
                                        }
                                    }
                                    add('"');
                                } else {
                                    add(`=${asCode(initializer)}`);
                                }
                            }
                        }
                        if (attrName === 'style' && initializer && ts.isJsxExpression(initializer)) {
                            add(``);
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
            add({ exp: asAst(`this.$rt.toString(${asCode(n.expression)})`) as ts.Expression });
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
    });

    return cloneDeep(ts.createTemplateExpression(ts.createTemplateHead(head), spans));
};
