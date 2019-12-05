import ts from 'typescript';
import { CompDefinition, DomBinding, JsxExpression, JsxComponent, CompProps, JsxRoot, printAST, cFunction, cBitMaskIf, cAccess, cAssign, isJsxExpression, createBitWiseOr, cCall, cArrow } from '@tsx-air/compiler-utils';

if (typeof window !== 'undefined') {
    (window as any).printAST = printAST;
}

export const createProcessUpdateForComp = (comp: CompDefinition, domBindings: DomBinding[]) => {
    return cFunction([comp.propsIdentifier!, 'state', 'changeMap'],
        comp.usedProps.map((prop: any) => cBitMaskIf(prop.name, {
            changedMaskName: 'changeMap',
            maskPath: [comp.name!, 'changeBitmask']
        }, [
            ...updateNativeExpressions(comp.jsxRoots[0], prop, domBindings),
            ...updateComponentExpressions(comp, comp.jsxRoots[0], prop, domBindings)
        ]))
    );
};

export const filterByDependencies = <T extends JsxExpression | JsxComponent>(prop: CompProps, exp: T[]) => {
    return exp.filter(ex => ex.dependencies.find(dep => dep.name === prop.name));
};

export const updateNativeExpressions = (root: JsxRoot, prop: CompProps, domBindings: DomBinding[]) => {
    const relevantExpressions = filterByDependencies(prop, root.expressions);
    const relevantExpressionsWithDom = relevantExpressions.map(exp => ({
        exp,
        dom: domBindings.find(bind => bind.astNode === exp.sourceAstNode)
    }));

    return relevantExpressionsWithDom.map(exp => cAssign(
        ['this', 'context', exp.dom!.ctxName, 'textContent'],
        exp.exp.sourceAstNode!.expression!));
};

export const updateComponentExpressions = (_comp: CompDefinition, root: JsxRoot, prop: CompProps, domBindings: DomBinding[]) => {
    const relevantExpressions = filterByDependencies(prop, root.components);
    const relevantComponentsWithDom = relevantExpressions.map(exp => ({
        exp,
        dom: domBindings.find(bind => bind.astNode === exp.sourceAstNode)
    }));
    const res: ts.Statement[] = [];
    for (const shadowComp of relevantComponentsWithDom) {
        const changed = shadowComp.exp.props.filter(p => isJsxExpression(p.value));
        if (changed.length) {
            const updateStatements: ts.Statement[] = [];
            for (const compProp of changed) {
                updateStatements.push(
                    cAssign(['p', compProp.name], (compProp.value as JsxExpression).sourceAstNode.expression!)
                );
            }
            updateStatements.push(ts.createReturn(
                createBitWiseOr([shadowComp.exp.name, 'changeBitmask'], changed.map(c => c.name))
            ));
            res.push(ts.createStatement(cCall(['TSXAir', 'runtime', 'updateProps'],
                [
                    cAccess('this', 'context', shadowComp.dom!.ctxName),
                    cArrow(['p'], ts.createBlock(updateStatements))
                ])));
        }

    }
    return res;

};
