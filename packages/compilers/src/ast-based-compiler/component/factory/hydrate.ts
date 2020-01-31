import { JsxRoot, CompDefinition, DomBinding, cNew, cObject, parseValue, cArrow, cloneDeep } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateHydrate = (_node: JsxRoot, comp: CompDefinition, domBindings: DomBinding[]) => {
    const body = cNew([comp.name!], [
        cObject(domBindings.reduce((accum, item) => {
            accum[item.ctxName] = cloneDeep(parseValue(item.viewLocator));
            return accum;
        }, { root: ts.createIdentifier('root') } as any)),
        ts.createIdentifier('props')
    ]);
    const props = comp.usedProps.length ? comp.propsIdentifier : undefined;
    return cArrow(['root', props], body);
};