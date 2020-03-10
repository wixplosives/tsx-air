import { CompDefinition, cMethod, cloneDeep, printAstText, cArrow, cCall, cLet, cAssignLiteral, cSpreadParams } from '@tsx-air/compiler-utils';
import { getGenericMethodParams, destructureState } from './helpers';
import ts from 'typescript';
import { cStateCall, isStoreDefinition } from './function';
import get from 'lodash/get';
import {VOLATILE} from '../consts';

export function* generatePreRender(comp: CompDefinition) {
    const statements =
        get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
    const params = getGenericMethodParams(comp, comp.aggregatedVariables, false, false);
    if (!statements?.length) {
        return;
    }

    const defined = new Set<string>();

    const modified = statements.map(s => {
        if (ts.isExpressionStatement(s)) {
            const stateChange = cStateCall(comp, s.expression, true);
            return stateChange || cloneDeep(s);
        }
        if (ts.isReturnStatement(s)) {
            return;
        }
        if (ts.isVariableStatement(s)) {
            const vars = volatileVars(comp, s);
            if (vars) {
                vars.declarationList.declarations.forEach(
                    v => {
                        defined.add(printAstText(v.name));
                        replaceFunc(v, comp, params as string[]);
                    }
                );
                return vars;
            }
            return;
        }
        return cloneDeep(s);
    }).filter(i => i) as ts.Statement[];

    if (modified.length === 0 && defined.size === 0) {
        return;
    }

    const state = destructureState(
        comp, comp.aggregatedVariables
    );
    if (state) {
        modified.unshift(state);
    }
    modified.unshift(cLet(VOLATILE, ts.createNull()));
    modified.push(cAssignLiteral(VOLATILE, [...defined.values()]));
    modified.push(ts.createReturn(ts.createIdentifier(VOLATILE)));

    yield cMethod('$preRender', params, modified);
}

const volatileVars = (comp: CompDefinition, vars: ts.VariableStatement) => {
    const withoutStores = vars.declarationList.declarations.filter(
        v => (!v.initializer || !isStoreDefinition(comp, v))
            && printAstText(v.name) in comp.aggregatedVariables.accessed
    );

    if (withoutStores.length) {
        return ts.createVariableStatement(vars.modifiers,
            ts.createNodeArray(withoutStores.map(v => cloneDeep(v)!)));
    } else {
        return undefined;
    }
};

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));

function replaceFunc(v: ts.VariableDeclaration, comp: CompDefinition, params: any[]) {
    if (isFunc(v)) {
        v.initializer = cArrow([cSpreadParams('args')],
            cCall([comp.name, 'prototype', printAstText(v.name), 'call'],
                [
                    ts.createThis(),
                    params[0] ? ts.createIdentifier(params[0] as string) : ts.createNull(),
                    params[1] ? ts.createIdentifier(params[1] as string) : ts.createNull(),
                    ts.createIdentifier(VOLATILE),
                    ts.createSpread(ts.createIdentifier('args'))
                ]));
    }
}