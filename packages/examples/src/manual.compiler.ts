import { asSourceFile, cloneDeep } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { Compiler } from '@tsx-air/compilers';

export const isSource = /\.source\.tsx?$/;
export type ContentSwapper = (src: string) => string | undefined;

function useManuallyCompiledForSources(getAlternativeContent: ContentSwapper): ts.TransformerFactory<ts.SourceFile> {
    return _ => node => {
        const { fileName } = node;
        const replacementContent = getAlternativeContent(fileName);
        if (replacementContent) {
            const compiled = asSourceFile(replacementContent);
            const reExported = ts.getMutableClone(node);
            reExported.statements =
                ts.createNodeArray(
                    compiled.statements.map(s => cloneDeep(s, reExported))
                );
            return reExported;
        }
        return node;
    };
}

export function getManuallyCompiled(getContent: ContentSwapper): Compiler {
    return {
        label: 'manually compiled examples',
        transformers: {
            before: [useManuallyCompiledForSources(getContent)]
        }
    };
}