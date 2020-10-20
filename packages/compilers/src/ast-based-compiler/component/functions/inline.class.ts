import { asAst, cClass, CompDefinition, FileTransformerAPI, FuncDefinition, UserCode } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { asMethod, parseStatements } from '.';
import { FragmentData } from '../fragment/jsx.fragment';
import { readFuncName } from './names';

export const parseInlineComp = (code: CompDefinition) =>
    code.functions.filter(fn => fn.jsxRoots.length);

export const isInlineComp = (fn: FuncDefinition) => fn.jsxRoots.length > 0;

const generateInlineComponentClass = (code: UserCode, func: FuncDefinition, fragments: FragmentData[], api: FileTransformerAPI) => {
    const name = readFuncName(func)!;
    fragments = fragments.filter(fg => func.jsxRoots.includes(fg.root));
    api.ensureImport('Inline, VirtualElement', '@tsx-air/runtime');
    const inlineClass = cClass(
        name,
        asAst(`Inline`) as ts.Expression,
        undefined,
        false,
        [
            parseUserCode(code, func, fragments)
        ]
    );
    return inlineClass;
};

export function* generateInlineComponents(comp: CompDefinition, fragments: FragmentData[], api: FileTransformerAPI) {
    for (const fn of comp.functions.filter(isInlineComp)) {
        yield generateInlineComponentClass(comp, fn, fragments, api);
        const name = readFuncName(fn);
        yield asAst(`${comp.name}.${name}=${name}`) as ts.Statement;
    }
}

function parseUserCode(code: UserCode, func: FuncDefinition, fragments: FragmentData[]) {
    const { body } = func.sourceAstNode;
    const statements = ts.isBlock(body) ? body.statements as any as ts.Statement[] : [ts.createReturn(body)];
    return asMethod(
        code, 'userCode', [],
        parseStatements(code, statements, fragments, true) as ts.Statement[]);
}