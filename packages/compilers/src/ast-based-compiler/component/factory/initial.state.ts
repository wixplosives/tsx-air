import { CompDefinition, cArrow, cObject, cloneDeep } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export function generateInitialState(comp: CompDefinition) {
    if (comp.stores.length) {
        const stores: Record<string, ts.ObjectLiteralExpression> = {};
        comp.stores.forEach(s => {
            stores[s.name] = cloneDeep(s.sourceAstNode.arguments[0]) as ts.ObjectLiteralExpression;
        });        
        const props = comp.usedProps.length ? comp.propsIdentifier : undefined;
        return cArrow([props],
            cObject(stores));
    }
    return cArrow([], cObject({}));
}