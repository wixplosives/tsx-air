import ts from 'typescript';

export interface Compiler {
    transformers: ts.CustomTransformers;
    label: string;
}