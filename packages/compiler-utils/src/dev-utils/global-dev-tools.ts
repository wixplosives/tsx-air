import { evalAst } from './eval.ast';
import ts from 'typescript';
import { printAst } from './print-ast';
import { tsKindInverse } from './invert.ts.kind';

(globalThis as any).devTools = {
    printAst,
    evalAst,
    ts,
    tsKindInverse
};
