import { JsxComponent } from './../../../../compiler-utils/src/analyzers/types';
import { propsAndStateParams, accessedVars } from './helpers';
import ts from 'typescript';
import { CompDefinition, DomBinding, JsxExpression, JsxRoot, cAccess, cAssign, createBitWiseOr, cCall, cArrow, JsxAttribute, isJsxExpression } from '@tsx-air/compiler-utils';
import { cBitMaskIf } from './bitmask';
import get from 'lodash/get';
import { safely } from '@tsx-air/utils';

export const createProcessUpdateForComp = (comp: CompDefinition, domBindings: DomBinding[]) => {
    const params = propsAndStateParams(comp);
    if (params[0] || params[1]) {
        params.push('changeMap');
    }
    const vars = accessedVars(comp);

    const changeHandlers = vars.map(prop => cBitMaskIf(prop, {
        changedMaskName: 'changeMap',
        maskPath: [comp.name!, 'changeBitmask']
    }, [
        ...updateNativeExpressions(comp.jsxRoots[0], prop, domBindings),
        ...updateComponentExpressions(comp, comp.jsxRoots[0], prop, domBindings)
    ]));

    return cArrow(params, [...changeHandlers]);
};

export const updateNativeExpressions = (root: JsxRoot, changed: string, domBindings: DomBinding[]) => {
    const dependentExpressions = root.expressions.filter(
        ex => get(ex.variables.accessed, changed)
    );
    const relevantExpressionsWithDom = dependentExpressions.map(exp => ({
        exp,
        dom: domBindings.find(bind => bind.astNode === exp.sourceAstNode)
    }));

    return relevantExpressionsWithDom.map(exp => cAssign(
        ['this', 'context', exp.dom!.ctxName, 'textContent'],
        exp.exp.sourceAstNode!.expression!));
};

export const updateComponentExpressions =
    (_comp: CompDefinition,
        root: JsxRoot,
        variable: string,
        domBindings: DomBinding[]) => {

        const isAffectedProp = (prop: JsxAttribute) =>
            isJsxExpression(prop.value) &&
            get(prop.value.variables.accessed, variable);
        const findDom = (jsxComp: JsxComponent) => safely(
            () => domBindings.find(bind => bind.astNode === jsxComp.sourceAstNode),
            `Dom binding not found for ${jsxComp.sourceAstNode.getText()}`, v => !!v)!;

        const affectedComps = root.components.filter(
            jsxComp => jsxComp.props.some(isAffectedProp)
        );

        const res: ts.Statement[] = [];

        for (const jsxComp of affectedComps) {
            const dom = findDom(jsxComp);
            const changedProps = jsxComp.props.filter(isAffectedProp);
            const updateStatements: ts.Statement[] = changedProps.map(
                prop => cAssign(['p', prop.name],
                    (prop.value as JsxExpression).sourceAstNode.expression!));

            updateStatements.push(ts.createReturn(
                createBitWiseOr([jsxComp.name, 'changeBitmask'],
                    changedProps.map(prop => prop.name))));

            res.push(ts.createStatement(cCall(['TSXAir', 'runtime', 'updateProps'],
                [
                    cAccess('this', 'context', dom.ctxName),
                    cArrow(['p'], ts.createBlock(updateStatements))
                ])));
        }
        return res;
    };
