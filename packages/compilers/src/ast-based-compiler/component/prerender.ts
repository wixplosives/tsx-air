import { CompDefinition, cMethod, cReturnLiteral, cloneDeep, printAstText, cArrow, cCall, cLet, cAssignLiteral, cSpreadParams } from '@tsx-air/compiler-utils';
import { getGenericMethodParams, destructureStateAndVolatile } from './helpers';
import ts from 'typescript';
import { cStateCall, isStoreDefinition } from './function';
import get from 'lodash/get';

export function generatePreRender(comp: CompDefinition): ts.MethodDeclaration | undefined {
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

    const d = destructureStateAndVolatile(
        comp, comp.aggregatedVariables
    );
    modified.unshift(d.next().value as ts.Statement);
    modified.unshift(cLet('volatile', ts.createNull()));

    modified.push(cAssignLiteral('volatile', [...defined.values()]));
    modified.push(cReturnLiteral([...defined.values()]));

    return cMethod('$preRender', params, modified);
}

const volatileVars = (comp: CompDefinition, vars: ts.VariableStatement) => {
    const withoutStores = vars.declarationList.declarations.filter(
        v => !v.initializer || !isStoreDefinition(comp, v)
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
                    ts.createIdentifier('volatile'),
                    ts.createSpread(ts.createIdentifier('args'))
                ]));
    }
}