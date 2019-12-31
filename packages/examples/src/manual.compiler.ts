import ts from 'typescript';
import { Compiler } from '@tsx-air/compilers';

const isSource = /\.source\.tsx?$/;

const useManuallyCompiledForSources: ts.TransformerFactory<ts.SourceFile> = _ => node => {
    const { fileName } = node;
    if (isSource.test(fileName)) {
        const reExported = ts.getMutableClone(node);
        reExported.statements = ts.createNodeArray(
            [
                ts.createExportDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    ts.createStringLiteral(fileName.replace(isSource, '.compiled'))
                )
            ]

        );
        return reExported;
    }
    return node;
};


export const manuallyCompiled: Compiler =
{
    label: 'manually compiled examples',
    transformers: {
        before: [useManuallyCompiledForSources]
    }
};
