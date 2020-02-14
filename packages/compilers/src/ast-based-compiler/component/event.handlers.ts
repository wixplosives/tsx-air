import { DomBinding } from '../../common/dom.binding';
import { CompDefinition, cProperty } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { safely } from '@tsx-air/utils/src';
import { generateStateAwareFunction } from './function';


export function eventHandlers(comp: CompDefinition) {
    const handlers = comp.jsxRoots[0].expressions.filter(
        e => ts.isJsxAttribute(e.sourceAstNode.parent));
    return handlers.map(e => safely(
        () => {
            const name = e.expression;
            const func = comp.functions.find(f => f.name === name);
            if (!func) {
                throw new Error(`Can't find handler ${name}`);
            }
            return cProperty(name, generateStateAwareFunction(comp, func));
        }, `Failed to map handler`
    ));
}
