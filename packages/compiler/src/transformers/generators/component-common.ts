import ts, { SyntaxKind } from 'typescript';
import { findJsxRoot, getComponentTag } from '../../visitors/jsx';
import { find } from '../../astUtils/scanner';

export interface DomBinding {
    ctxName:string;
    viewLocator: string;
    astNode?: ts.Node;
}

export const findDomBindings = (node: ts.Node) => {
    const expressions: DomBinding[] = [];
    const returnedJsx = find(node, findJsxRoot);

    const addDomElement = (nd: ts.Node, prefix = 'root.childNode') => {
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
                case SyntaxKind.JsxElement:
                case SyntaxKind.JsxSelfClosingElement:
                    const tag = getComponentTag(child);
                    if (tag) {
                        expressions.push({
                            ctxName: `${tag}${++compCount}`,
                            viewLocator: `${tag}.factory.hydrate(${prefix}[${childCount}])`,
                            astNode: child
                        });
                    } else {
                        addDomElement(child, `${prefix}[${childCount}].childNode`);
                    }
                    childCount++;
                    break;
                default:
                // throw new Error('Unhandled JSX hydration');
            }
        });
    };

    addDomElement(returnedJsx);
    return expressions;
};