import { evalAst } from './eval.ast';
import ts from 'typescript';
import { printAst } from './print-ast';

(globalThis as any).devTools = {
    printAst,
    evalAst,
    ts
};
