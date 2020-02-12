import { CompDefinition, DomBinding, cNew, cObject, parseValue, cArrow, cloneDeep, cCall, JsxExpression } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const generateHydrate = (comp: CompDefinition, domBindings: DomBinding[]) => {
    const dom: Record<string, ts.ElementAccessExpression | ts.Identifier | ts.CallExpression> = { root: ts.createIdentifier('root') };
    const props: Record<string, ts.JsxExpression> = {};
    domBindings.forEach(({ ctxName, domLocator, compType, astNode }) => {
        const locator = cloneDeep(parseValue(domLocator)) as ts.ElementAccessExpression;
        if (compType) {
            const jsxComp = comp.jsxRoots[0]!.components.filter(i => i.sourceAstNode === astNode)[0];
            if (jsxComp) {
                jsxComp.props.forEach(p =>
                    props[p.name] = cloneDeep(parseValue((p.value as JsxExpression).expression)) as ts.JsxExpression);
            }

            dom[ctxName] = cCall([compType, 'factory', 'hydrate'], [
                locator,
                cObject(props),
                ts.createIdentifier('state')
            ]);
        } else {
            dom[ctxName] = locator;
        }
    });

    const params: Array<ts.ObjectLiteralExpression | ts.Identifier> = [
        cObject(dom),
        ts.createIdentifier(comp.propsIdentifier || 'props'),
        ts.createIdentifier('state')
    ];

    const body = cNew([comp.name!], params);
    return cArrow(['root', comp.propsIdentifier || 'props', 'state'], body);
};