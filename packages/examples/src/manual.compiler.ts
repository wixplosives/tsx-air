import { asSourceFile, cloneDeep } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { Compiler } from '@tsx-air/types';

export const isSource = /\.source\.tsx?$/;
export type ContentSwapper = (src: string) => string | undefined;

export class ManuallyCompiled implements Compiler {
    public get transformers(): ts.CustomTransformers {
        if (this.contentSwapper) {
            return {
                before: [useManuallyCompiledForSources(this.contentSwapper)]
            };
        } else {
            throw new Error(`ManuallyCompiled contentSwapper must be defined`);
        }
    }
    public readonly label = 'Manually compiled';

    constructor(public contentSwapper?: ContentSwapper) {
    }
}

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
