import { JsxRoot, CompDefinition, DomBinding, cNew, cObject, parseValue, cArrow, cloneDeep } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateHydrate = (_node: JsxRoot, comp: CompDefinition, domBindings: DomBinding[]) => {
    const params: Array<ts.ObjectLiteralExpression|ts.Identifier> = [
        cObject(domBindings.reduce((accum, item) => {
            accum[item.ctxName] = cloneDeep(parseValue(item.viewLocator));
            return accum;
        }, { root: ts.createIdentifier('root') } as any)),
        ts.createIdentifier('props'),
        ts.createIdentifier('state')
    ];

    const body = cNew([comp.name!], params);
    return cArrow(['root', 'props', 'state'], body);
};