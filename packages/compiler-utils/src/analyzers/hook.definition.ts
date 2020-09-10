import { Analyzer, HookDefinition } from '.';
import ts from 'typescript';
import { errorNode } from './types.helpers';

export const hookDefinition: Analyzer<HookDefinition> = (node: ts.Node) => {
    return errorNode<HookDefinition>(node, 'Not a hook definition', 'internal');
};