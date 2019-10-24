import { tsxair } from './visitors/jsx';
import ts from 'typescript';
import { ScannedChild, ScannedJSX } from './types';
import { scan } from './scanner';
// import { createToStringMethod } from './toStringGenerator';
// import { createToHydrateMethod } from './hydrateGenerator';
(window as any).ts = ts;

export function tsxAirTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    return sourceFile => {
        const jsxs = scan(sourceFile, tsxair).filter(({note})=>note === '/* Jsx */');
        sourceFile = ts.visitEachChild(sourceFile, replaceTsxAirFunctions, context);

        return sourceFile;

        function replaceTsxAirFunctions(n: ts.Node): ts.Node | ts.Node[] {
            
            const jsxItem = jsxs.find(
                ({node})=> 
                    node === n);
            if (jsxItem ) {
                // const {node} = jsxItem;

                const mockFile = ts.createSourceFile('frag1.ts', `
                export const frag = {
                    toString: () => 'string',
                    hydrate: () => undefined
                };`, ts.ScriptTarget.Latest);

                const literals = scan(mockFile, (nd, {ignoreChildren})=>{
                    if (ts.isObjectLiteralExpression(nd)) {
                        ignoreChildren();
                        return 'Literal';
                    }
                    return undefined;
                });

                if (literals.length !== 1) {
                    throw new Error('Failed to get source AST');
                }
                
                return literals[0].node;
              
                // return ts.createCall(ts.createIdentifier('TSXAir'), [], [ts.createObjectLiteral([
                //     ts.createPropertyAssignment('unique', ts.createCall(ts.createIdentifier('Symbol'), undefined, [ts.createStringLiteral((node.parent! as any).name.getText())])),
                //     createToStringMethod(scanned),
                    // createToHydrateMethod(scanned)
                // ], true)]);

            } else {
                return ts.visitEachChild(n, replaceTsxAirFunctions, context);
            } 


            // return node;
        }
    };


    function createReturnStatementsVisitor() {
        const returnStatements: ts.ReturnStatement[] = [];
        const visitor = (node: ts.Node) => {
            if (ts.isReturnStatement(node)) {
                returnStatements.push(node);
            }
            ts.visitEachChild(node, visitor, context);
            return node;
        };
        return {
            returnStatements,
            visitor
        };

    }

    function getJSXElements(node: ts.JsxElement | ts.JsxSelfClosingElement, counters: Record<string, number>, path: number[]): ScannedJSX {
        const attrNode = ts.isJsxSelfClosingElement(node) ? node : node.openingElement;
        const elementType = attrNode.tagName.getText();
        if (!counters[elementType]) {
            counters[elementType] = 1;
        } else {
            counters[elementType]++;
        }
        return {
            kind: 'jsx',
            path,
            key: elementType + counters[elementType],
            type: elementType,
            attributes: attrNode.attributes.properties.map(child => {
                if (!ts.isJsxAttribute(child)) {
                    throw new Error('unhandled');
                }
                const initializer = child.initializer;
                if (!initializer) {
                    return {
                        name: child.name.getText(),
                        value: 'true'
                    };
                }
                if (ts.isStringLiteral(initializer)) {
                    return {
                        name: child.name.getText(),
                        value: child.initializer ? child.initializer.getText() : 'true'
                    };
                }
                return {
                    name: child.name.getText(),
                    value: {
                        kind: 'expression',
                        expression: initializer.expression!.getText()
                    }
                };

            }),
            children: ts.isJsxElement(node) && node.children ? node.children.map((item, idx) => handleJSXChild(item, counters, path.concat(idx))) : []
        };
    }

    function handleJSXChild(node: ts.JsxChild, counters: Record<string, number>, path: number[]): ScannedChild {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            return getJSXElements(node, counters, path);
        } else if (ts.isJsxText(node)) {
            return {
                kind: 'text',
                text: node.getText()
            };
        } else if (ts.isJsxExpression(node)) {
            return {
                kind: 'expression',
                expression: node.expression!.getText()
            };
        }
        throw new Error('unhandled');
    }

}


