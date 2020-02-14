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
        nd.forEachChild(child => {
            switch (child.kind) {
                case SyntaxKind.JsxText:
                    childCount++;
                    break;
                case SyntaxKind.JsxExpression:
                    domBound.set(child, {
                        ctxName: `exp${domBound.size}`,
                        domLocator: `${prefix}.childNodes[${childCount + 1}]`,
                        astNode: child
                    });
                    childCount += 3;
                    break;
                case SyntaxKind.JsxOpeningElement:
                case SyntaxKind.JsxSelfClosingElement:
                    const compName = getComponentTag(child);
                    if (compName) {
                        domBound.set(child, {
                            ctxName: `${compName}${domBound.size}`,
                            domLocator: `${prefix}.childNodes[${childCount}]`,
                            compType: compName,
                            astNode: ts.isJsxSelfClosingElement(child)
                                ? child
                                : child.parent
                        });
                    } else {
                        // @ts-ignore
                        const props = child?.attributes?.properties as ts.NodeArray<ts.JsxAttribute>;
                        if (props.some(p =>
                            ts.isJsxAttribute(p) && p.initializer &&
                            ts.isJsxExpression(p.initializer)
                        )) {
                            domBound.set(child, {
                                ctxName: `elm${domBound.size}`,
                                domLocator: `${prefix}`,
                                astNode: child
                            });
                        }
                        addDomElement(child, `${prefix}[${childCount}].childNodes`);
                    }
                    if (ts.isJsxSelfClosingElement(child)) {
                        childCount++;
                    }
                    break;
                default:
                // console.log(child.getText());
            }
        });
    };

    addDomElement(compDef.jsxRoots[0].sourceAstNode);
    return domBound;
}