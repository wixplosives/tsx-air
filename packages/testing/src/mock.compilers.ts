import { Compiler } from '@tsx-air/compilers';
import ts from 'typescript';

export function createMockpiler(injectExport?:string): Compiler {
    return {
        transformers: {
            before: injectExport ? [
                _ => file => {
                    const reExported = ts.getMutableClone(file);
                    reExported.statements = ts.createNodeArray(
                        [...file.statements.map(s => ts.getMutableClone(s)),
                        ts.createVariableStatement(
                            [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
                            ts.createVariableDeclarationList(
                                [ts.createVariableDeclaration(
                                    ts.createIdentifier(injectExport),
                                    undefined,
                                    ts.createTrue()
                                )],
                                ts.NodeFlags.Const
                            )
                        )
                        ]
                    );
                    return reExported;
                }
            ] : []
        },
        label: injectExport ? 
            `add "export const ${injectExport}=true" to source'`
            : 'copier'
    };
}
