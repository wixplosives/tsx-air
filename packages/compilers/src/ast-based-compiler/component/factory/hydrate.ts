import { JsxRoot, CompDefinition, DomBinding, cNew, cObject, parseValue, cArrow, cloneDeep } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateHydrate = (_node: JsxRoot, parentComp: CompDefinition, domBindings: DomBinding[]) => {
    const body = cNew([parentComp.name!], [
        cObject(domBindings.reduce((accum, item) => {
            accum[item.ctxName] = cloneDeep(parseValue(item.viewLocator));
            return accum;
        }, { root: ts.createIdentifier('root') } as any)),
        ts.createIdentifier('props')
    ]);
    return cArrow(['root', parentComp.propsIdentifier || 'props'], body);
};