import ts, { SyntaxKind } from 'typescript';
import { findJsxRoot, getComponentTag } from '../../visitors/jsx';
import { find } from '../../astUtils/scanner';

export interface DomBinding {
    name:string;
    dom: string;
    node?: ts.Node;
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
                        name: `exp${expressions.length}`,
                        dom: `${prefix}[${childCount + 1}]`,
                        node: child
                    });
                    childCount += 3;
                    break;
                case SyntaxKind.JsxElement:
                case SyntaxKind.JsxSelfClosingElement:
                    const tag = getComponentTag(child);
                    if (tag) {
                        expressions.push({
                            name: `${tag}${++compCount}`,
                            dom: `${tag}.factory.hydrate(${prefix}[${childCount}])`,
                            node: child
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