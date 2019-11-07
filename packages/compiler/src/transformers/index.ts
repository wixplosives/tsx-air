import ts from 'typescript';
import { tsxAir } from './tsx-air';

export interface Transformer {
    name:string;
    description:string;
    transformer: (context: ts.TransformationContext)=> ts.Transformer<ts.SourceFile>;
    requires: Transformer[];
}

export const transformers = [
    tsxAir
];
