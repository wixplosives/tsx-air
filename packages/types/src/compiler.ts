import ts from 'typescript';

export interface Compiler {
    readonly transformers: ts.CustomTransformers;
    readonly label: string; 
}