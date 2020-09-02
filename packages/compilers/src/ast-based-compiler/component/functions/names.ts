import { CompDefinition, FuncDefinition, asAst } from '@tsx-air/compiler-utils';
import { postAnalysisData } from '../../../common/post.analysis.data';
import ts from 'typescript';

export const readFuncName = (func: FuncDefinition) => postAnalysisData.read(func, 'name')!;
export const readNodeFuncName = (func: ts.Node) => postAnalysisData.readByAst(func, 'name')!;
export const writeFuncName = (func: FuncDefinition, name: string) =>
    postAnalysisData.write(func, 'name', name);

export function assignFunctionNames(comp: CompDefinition) {
    comp.functions.forEach((func, i) => {
        writeFuncName(func, func.name || `lambda${i}`);
    });
}

export function* addNamedFunctions(comp: CompDefinition) {
    const names = namedFuncs(comp);
    if (names.length) {
        yield asAst(`const  {${names.join(',')}}=this;`) as ts.Statement;
    }
}

export const namedFuncs = (comp: CompDefinition) =>
    comp.functions.filter(f => f.name).map(f => f.name);
