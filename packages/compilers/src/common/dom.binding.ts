import { CompDefinition } from '../../../compiler-utils/src/analyzers/types';
import ts, { SyntaxKind } from 'typescript';
import { getComponentTag } from '../../../compiler-utils/src/visitors/jsx';

export interface DomBinding {
    ctxName:string;
    viewLocator: string;
    astNode?: ts.Node;
}

/**
 * Create DOM bindings for DOM elements with data such as
 * - <div>{a}</div>
 * - <div attr="{a}" />
 * @param compDef 
 * @return DOM elements that include JSX expressions 
 */
export const generateDomBindings = (compDef: CompDefinition) => {
    const expressions: DomBinding[] = [];
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
                    expressions.push({
                        ctxName: `exp${expressions.length}`,
                        viewLocator: `${prefix}[${childCount + 1}]`,
                        astNode: child
                    });
                    childCount += 3;
                    break;
                case SyntaxKind.JsxOpeningElement:
                case SyntaxKind.JsxElement:
                case SyntaxKind.JsxSelfClosingElement:
                    const tag = getComponentTag(child);
                    if (tag) {
                        expressions.push({
                            ctxName: `${tag}${++compCount}`,
                            // TODO handle props mapping
                            viewLocator: `${tag}.factory.hydrate(${prefix}[${childCount}], props)`,
                            astNode: child
                        });
                    } else {
                        addDomElement(child, `${prefix}[${childCount}].childNodes`);
                    }
                    childCount++;
                    break;
                case SyntaxKind.JsxClosingElement:
                    break;
                default:
                    console.log(child.getText());
                // throw new Error('Unhandled JSX hydration');
            }
        });
    };

    addDomElement(compDef.jsxRoots[0].sourceAstNode);
    return expressions;
};