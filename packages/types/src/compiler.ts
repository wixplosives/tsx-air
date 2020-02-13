import ts from 'typescript';
import { Features } from './features';

export interface Compiler {
    readonly transformers: ts.CustomTransformers;
    readonly label: string; 
    readonly features:Features;
}