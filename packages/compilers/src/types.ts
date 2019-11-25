import ts from 'typescript';

export interface NamedCompiler {
    name: string;
    transformers: ts.CustomTransformers;
}