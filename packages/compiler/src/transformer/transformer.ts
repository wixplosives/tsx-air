import { tsxair } from '../visitors/jsx';
import ts from 'typescript';
import { scan } from '../astUtils/scanner';
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
              

            } else {
                return ts.visitEachChild(n, replaceTsxAirFunctions, context);
            } 


            // return node;
        }
    };
}


