import ts from 'typescript';

export const printAst = (n: ts.Node) => {
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        omitTrailingSemicolon: true,
        noEmitHelpers: true
    });

    const res = printer.printNode(ts.EmitHint.Unspecified, n, n.getSourceFile() || ts.createSourceFile('temp.tsx', ``, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
    return res;
};

export const printAstText = (n:ts.Node) => {
    if (n.pos > -1 && n.end > -1) {
        return n.getText();
    }
    return printAst(n);
};

