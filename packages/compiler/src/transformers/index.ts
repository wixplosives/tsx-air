import ts from 'typescript';
import { jsx } from './jsx';

export interface Transformer {
    name:string;
    description:string;
    transformer: (context: ts.TransformationContext)=> ts.Transformer<ts.SourceFile>;
    requires: Transformer[];
}

export const transformers = [
    jsx
];
