import { isArray } from 'lodash';
import ts from 'typescript';
import { Return } from '.';
import { asCode } from '..';

export function* findStatementReturns(statement?: ts.Node | ts.Node[] | ts.NodeArray<ts.Node>): Generator<Return> {
    if (isArray(statement)) {
        for (const s of statement) {
            yield* findStatementReturns(s);
        }
    } else {
        switch ((statement as ts.Node)?.kind) {
            case ts.SyntaxKind.IfStatement:
                const ifs = statement as ts.IfStatement;
                yield* findStatementReturns(ifs.thenStatement);
                yield* findStatementReturns(ifs.elseStatement);
                break;

            case ts.SyntaxKind.SwitchStatement:
                const switches = statement as ts.SwitchStatement;
                for (const clause of switches.caseBlock.clauses) {
                    yield* findStatementReturns(clause.statements);
                }
                break;

            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
                yield* findStatementReturns((statement as ts.ForStatement).statement);
                break;

            case ts.SyntaxKind.Block:
                yield* findStatementReturns((statement as ts.Block).statements);
                break;

            case ts.SyntaxKind.ReturnStatement:
                const ret = statement as ts.ReturnStatement;
                yield {
                    kind: 'Return',
                    sourceAstNode: ret,
                    parentStatement: ret,
                    value: ret.expression
                        ? asCode(ret.expression)
                        : 'undefined'
                };
                break;
        }
    }
}

export function findReturns(comp: ts.FunctionLikeDeclaration): Return[] {
    if (!comp.body) {
        throw new Error(`Invalid component`);
    }
    return [...findStatementReturns(comp.body)];
}