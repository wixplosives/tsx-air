import ts, { SyntaxKind } from 'typescript';
import { CompDefinition, getComponentTag } from '@tsx-air/compiler-utils';

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
    const domBound: DomBindings = new Map();
    if (compDef.jsxRoots.length !== 1) {
        throw new Error('Unsupported (yet): TSXAir components must have a single JsxRoot');
    }

    const addDomElement = (nd: ts.Node, prefix = 'root') => {
        let childCount = 0;
        let elmCount = 0;

        const checkElement = (node: ts.Node) => {
            if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
                // tslint:disable-next-line: no-unused-expression
                handleAsComponent(node) || handleAsNativeElm(node);
                if (!ts.isJsxSelfClosingElement(node)) {
                    node.forEachChild(checkNode);
                }
            }
        };

        const handleAsComponent = (astNode: ts.Node) => {
            const compName = getComponentTag(astNode);
            if (compName) {
                domBound.set(astNode, {
                    ctxName: `${compName}${domBound.size}`,
                    domLocator: `${prefix}`,
                    compType: compName,
                    astNode
                });
            }
            return !!compName;
        };

        const handleAsNativeElm = (astNode: ts.JsxElement | ts.JsxSelfClosingElement) => {
            const props = ts.isJsxElement(astNode)
                ? astNode.openingElement.attributes.properties
                : astNode.attributes.properties;
            if (props && props.some(p =>
                ts.isJsxAttribute(p) && p.initializer &&
                ts.isJsxExpression(p.initializer)
            )) {
                domBound.set(astNode, {
                    ctxName: `elm${domBound.size}`,
                    domLocator: `${prefix}`,
                    astNode
                });
            }
        };

        const checkNode = (node: ts.Node) => {
            switch (node.kind) {
                case SyntaxKind.JsxText:
                    if (node.getText()) {
                        childCount++;
                    }
                    break;
                case SyntaxKind.JsxExpression:
                    domBound.set(node, {
                        ctxName: `exp${domBound.size}`,
                        domLocator: `${prefix}.childNodes[${childCount + 1}]`,
                        astNode: node
                    });
                    childCount += 3;
                    break;
                case SyntaxKind.JsxElement:
                case SyntaxKind.JsxSelfClosingElement:
                    addDomElement(node, `${prefix}.children[${elmCount}]`);
                    elmCount++;
                    childCount++;
                    break;
                default:
            }
        };

        checkElement(nd);
    };

    addDomElement(compDef.jsxRoots[0].sourceAstNode);
    return domBound;
}