import ts from 'typescript';
import { UsedVariables, RecursiveMap, UsedInScope } from '../analyzers/types';
import { cloneDeepWith, omit } from 'lodash';

export function printAst(n: ts.Node): string {
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        omitTrailingSemicolon: true,
        noEmitHelpers: true
    });

    const res = printer.printNode(ts.EmitHint.Unspecified, n, n.getSourceFile() || ts.createSourceFile('temp.tsx', ``, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
    return res;
}

export function asCode(n: ts.Node): string {
    if (!n) { return ''; }
    try {
        if (n.pos > -1 && n.end > -1 && n.getText && !ts.isSourceFile(n)) {
            return n.getText();
        }
    } catch { /* */ }
    return printAst(n);
}

export function printAstFullText(n: ts.Node): string {
    if (!n) { return ''; }
    try {
        if (n.pos > -1 && n.end > -1 && n.getFullText && !ts.isSourceFile(n)) {
            return n.getFullText();
        }
    } catch { /* */ }
    return printAst(n);
}

export function withCodeRefs(used: RecursiveMap): RecursiveMap<string>;
export function withCodeRefs(used: UsedVariables): UsedVariables<string>;
export function withCodeRefs(used: UsedInScope): UsedInScope<string>;
export function withCodeRefs(used: RecursiveMap | UsedVariables | UsedInScope) {
    return cloneDeepWith(used, (node: RecursiveMap) => {
        if (node instanceof Array) {
            return node.map(ast => asCode(ast));
        } else {
            return;
        }
    });
}

export function withNoRefs(used: RecursiveMap): RecursiveMap<string>;
export function withNoRefs(used: UsedVariables): UsedVariables<string>;
export function withNoRefs(used: UsedInScope): UsedInScope<string>;
export function withNoRefs(used: RecursiveMap | UsedVariables | UsedInScope) {
    return cloneDeepWith(used, (node: RecursiveMap) => {
        if (node?.$refs instanceof Array) {
            return omit(node, '$refs');
        } else {
            return;
        }
    });
}