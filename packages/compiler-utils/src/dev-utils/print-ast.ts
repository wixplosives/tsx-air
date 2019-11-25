import ts from 'typescript';

export const printAST = (n: ts.Node) => {

    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        omitTrailingSemicolon: true,
        noEmitHelpers: true
    });

    const res = printer.printNode(ts.EmitHint.Unspecified, n, n.getSourceFile() || ts.createSourceFile('temp.tsx', ``, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
    return res;
};