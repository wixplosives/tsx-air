import ts from 'typescript';
import { Compiler, Features, ALL } from '@tsx-air/types';
import { basename } from 'path';

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
    public readonly features: Features = ALL;

    constructor(public contentSwapper?: ContentSwapper) {
    }
}

function useManuallyCompiledForSources(getAlternativeContent: ContentSwapper): ts.TransformerFactory<ts.SourceFile> {
    return _ => node => {
        const { fileName } = node;
        const replacementContent = getAlternativeContent(fileName);
        if (replacementContent) {
            // const compiled = asSourceFile(replacementContent);
            const reExported = ts.getMutableClone(node);
            reExported.statements =
                ts.createNodeArray(
                    [ts.createExportDeclaration(
                        undefined,
                        undefined,
                        undefined,
                        ts.createStringLiteral('./' +
                            basename(fileName).replace(/source\.tsx?/, 'compiled')))
                    ]
                );
            return reExported;
        }
        return node;
    };
}
