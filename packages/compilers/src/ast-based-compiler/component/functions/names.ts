import { FuncDefinition, asAst, UserCode } from '@tsx-air/compiler-utils';
import { postAnalysisData } from '../../../common/post.analysis.data';
import ts from 'typescript';
import { definedFuncsAndHandlers } from '../helpers';

export const readFuncName = (func: FuncDefinition) => postAnalysisData.read(func, 'name')! as string | undefined;
export const readNodeFuncName = (func: ts.Node) => postAnalysisData.readByAst(func, 'name')! as string | undefined;
export const writeFuncName = (func: FuncDefinition, name: string) =>
    postAnalysisData.write(func, 'name', name);

export function assignFunctionNames(code: UserCode) {
    let i = 0;
    for (const func of definedFuncsAndHandlers(code)) {
        writeFuncName(func, func.name || `lambda${i++}`);
    }
}

export function* addNamedFunctions(code: UserCode) {
    const names = namedFuncs(code);
    if (names.length) {
        yield asAst(`const  {${names.join(',')}}=this;`) as ts.Statement;
    }
}

export const namedFuncs = (code: UserCode) =>
    code.functions.filter(f => f.name).map(f => f.name);
