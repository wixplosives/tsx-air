import ts, { SyntaxKind } from 'typescript';
import { CompDefinition, getComponentTag } from '@tsx-air/compiler-utils';
import { isEventHandler } from './jsx.event.handler';

export interface DomBinding {
    ctxName: string;
    domLocator: string;
    astNode: ts.Node;
    compType?: string;
}

export type DomBindings = Map<ts.Node, DomBinding>;

/**
 * Create DOM bindings for DOM elements with data such as
 * - <div>{a}</div>
 * - <div attr="{a}" />
 * @param compDef 
 * @return DOM elements that include JSX expressions 
 */
export function generateDomBindings(compDef: CompDefinition) {
    const expressions: DomBindings = new Map();
    if (compDef.jsxRoots.length !== 1) {
        throw new Error('Unsupported (yet): TSXAir components must have a single JsxRoot');
    }

    const addDomElement = (nd: ts.Node, prefix = 'root.childNodes') => {
        let childCount = 0;
        let compCount = 0;
        nd.forEachChild(child => {
            switch (child.kind) {
                case SyntaxKind.JsxText:
                    childCount++;
                    break;
                case SyntaxKind.JsxExpression:
                    expressions.set(child, {
                        ctxName: `exp${expressions.size}`,
                        domLocator: `${prefix}[${childCount + 1}]`,
                        astNode: child
                    });
                    childCount += 3;
                    break;
                case SyntaxKind.JsxElement:
                case SyntaxKind.JsxSelfClosingElement:
                    const tag = getComponentTag(child);
                    if (tag) {
                        expressions.set(child, {
                            ctxName: `${tag}${++compCount}`,
                            // TODO handle props mapping
                            domLocator: `${prefix}[${childCount}]`,
                            compType: tag,
                            astNode: child
                        });
                    } else {
                        addDomElement(child, `${prefix}[${childCount}].childNodes`);
                    }
                    childCount++;
                    break;
                case SyntaxKind.JsxOpeningElement:
                    const elm = child as ts.JsxOpeningElement;
                    if (elm.attributes.properties.some(p =>
                        ts.isJsxAttribute(p) && p.initializer &&
                        ts.isJsxExpression(p.initializer)
                    )) {
                        console.log(elm.attributes.getText())
                    }
                    break;
                case SyntaxKind.JsxClosingElement:
                    break;
                default:
                // console.log(child.getText());
                // throw new Error('Unhandled JSX hydration');
            }
        });
    };

    addDomElement(compDef.jsxRoots[0].sourceAstNode);
    return [...expressions.values()];
}