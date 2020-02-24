import { propsAndStateParams, accessedVars } from './helpers';
import ts from 'typescript';
import {
    CompDefinition, JsxExpression, JsxRoot, cAccess,
    cAssign, createBitWiseOr, cCall, cArrow, JsxAttribute,
    isJsxExpression, JsxComponent, printAstText, cMethod
} from '@tsx-air/compiler-utils';
import { cBitMaskIf } from './bitmask';
import get from 'lodash/get';
import { safely } from '@tsx-air/utils';
import { extractPreRender } from './function';
import { DomBindings } from '../../common/dom.binding';

export const createProcessUpdateMethod = (comp: CompDefinition, domBindings: DomBindings) => {
    const params = propsAndStateParams(comp);
    if (params[0] || params[1]) {
        params.push('changeMap');
        params.push('externalUpdatesCount');
    }
    const vars = accessedVars(comp);

    const changeHandlers = vars.map(prop => cBitMaskIf(prop, comp.name!, [
        ...updateNativeExpressions(comp.jsxRoots[0], prop, domBindings),
        ...updateComponentExpressions(comp, comp.jsxRoots[0], prop, domBindings)
    ]));

    return cMethod('$$processUpdate', params, createUpdateBody(extractPreRender(comp), changeHandlers));
};

export const createUpdateBody = (preRender: ts.Statement[], changeHandlers: ts.IfStatement[]) => {
    if (!changeHandlers.length) {
        return [];
    }
    if (preRender.length) {
        return [ts.createDo(
            ts.createBlock(
                [
                    ...preRender,
                    ts.createIf(
                        ts.createPrefix(
                            ts.SyntaxKind.ExclamationToken,
                            ts.createIdentifier('externalUpdatesCount')
                        ),
                        ts.createBlock(
                            changeHandlers,
                            true
                        ),
                        undefined
                    )
                ],
                true
            ),
            ts.createBinary(
                ts.createPostfix(
                    ts.createIdentifier('externalUpdatesCount'),
                    ts.SyntaxKind.MinusMinusToken
                ),
                ts.createToken(ts.SyntaxKind.GreaterThanToken),
                ts.createNumericLiteral('0')
            )
        )];
    }
    return changeHandlers;
};

export const updateNativeExpressions = (root: JsxRoot, changed: string, domBindings: DomBindings) => {
    const dependentExpressions = root.expressions.filter(
        ex => get(ex.variables.accessed, changed)
    );

    return dependentExpressions.map(exp => {
        const dom = domBindings.get(exp.sourceAstNode)?.ctxName;
        if (dom) {
            return cAssign(
                ['this', 'context', dom, 'textContent'],
                exp.sourceAstNode!.expression!);
        } else {
            const attr = exp.sourceAstNode.parent;
            if (ts.isJsxAttribute(attr)) {
                const name = printAstText(attr.name);
                const element = (domBindings.get(attr.parent.parent) ||
                    domBindings.get(attr.parent.parent.parent))?.ctxName;
                if (name && element) {
                    return ts.createStatement(
                        cCall(
                            ['this', 'context', element, 'setAttribute'],
                            [ts.createIdentifier(name), exp.sourceAstNode!.expression!]
                        ));
                }
            }
            throw new Error('Dom binding error with\n' + printAstText(exp.sourceAstNode));
        }
    });
};

export const updateComponentExpressions =
    (_comp: CompDefinition,
        root: JsxRoot,
        variable: string,
        domBindings: DomBindings) => {

        const isAffectedProp = (prop: JsxAttribute) =>
            isJsxExpression(prop.value) &&
            get(prop.value.variables.accessed, variable);
        const findDom = (jsxComp: JsxComponent) => safely(
            () => domBindings.get(jsxComp.sourceAstNode),
            `Dom binding not found for ${jsxComp.sourceAstNode.getText()}`,
            v => !!v)!;

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
                createBitWiseOr(jsxComp.name, changedProps.map(prop => `props.${prop.name}`))));

            res.push(ts.createStatement(cCall(['TSXAir', 'runtime', 'updateProps'],
                [
                    cAccess('this', 'context', dom.ctxName),
                    cArrow(['p'], ts.createBlock(updateStatements))
                ])));
        }
        return res;
    };
