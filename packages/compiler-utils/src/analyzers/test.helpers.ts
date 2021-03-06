import { compDefinition } from './component.definition';
import ts from 'typescript';
import { asAst } from '../ast-utils/parser';
import { find } from '../ast-utils/scanner';
import { CompDefinition } from './types';

export const getCompDef = (code: string) => {
    const ast = asAst(code, true);
    const tsxairNode = find(ast, node => ts.isCallExpression(node));
    const comp = compDefinition(tsxairNode).tsxAir as CompDefinition;

    return { ast, comp, tsxairNode };
};