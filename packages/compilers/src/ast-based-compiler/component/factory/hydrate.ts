import { CompDefinition, DomBinding, cNew, cObject, parseValue, cArrow, cloneDeep, cCall, JsxExpression, cSafeAccess } from '@tsx-air/compiler-utils';
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
                cStateAccess(ctxName)
            ]);
        } else {
            dom[ctxName] = locator;
        }
    });

    const newCompParams: Array<ts.ObjectLiteralExpression | ts.Identifier> = [
        cObject(dom),
        ts.createIdentifier(comp.propsIdentifier || 'props'),
        ts.createIdentifier('state')
    ];

    const body = cNew([comp.name!], newCompParams);
    return cArrow(['root', comp.propsIdentifier || 'props', 'state'], body);
};


const cStateAccess = (name: string) => ts.createBinary(
    ts.createBinary(
        ts.createIdentifier('state'),
        ts.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        ts.createPropertyAccess(
            ts.createIdentifier('state'),
            ts.createIdentifier('__childComps')
        )
    ),
    ts.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    ts.createPropertyAccess(
        ts.createPropertyAccess(
            ts.createIdentifier('state'),
            ts.createIdentifier('__childComps')
        ),
        ts.createIdentifier(name)
    )
);
