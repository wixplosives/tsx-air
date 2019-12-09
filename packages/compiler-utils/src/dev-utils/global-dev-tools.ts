import ts from 'typescript';
import { printAST } from './print-ast';

if (typeof window !== 'undefined') {
    (window as any).devTools = {
        printAST,
        ts
    };
}

if (typeof global !== 'undefined') {
    (global as any).devTools = {
        printAST,
        ts
    };
}