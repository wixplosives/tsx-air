import ts from 'typescript';
import { printAst } from './print-ast';

(globalThis as any).devTools = {
    printAST: printAst,
    ts
};
