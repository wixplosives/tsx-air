import ts from 'typescript';
import { printAST } from './print-ast';

(globalThis as any).devTools = {
    printAST,
    ts
};
