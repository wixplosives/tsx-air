import { VOLATILE } from './../consts';
import { CompDefinition, cMethod, cloneDeep, asCode, cLet, cAssignLiteral, asAst } from '@tsx-air/compiler-utils';
import { getGenericMethodParams, destructureState, usedInScope } from './helpers';
import ts from 'typescript';
import { cStateCall, isStoreDefinition } from './function';
import get from 'lodash/get';
import { postAnalysisData } from '../../common/post.analysis.data';
import { cleanParams } from 'packages/compiler-utils/src/ast-utils/generators/helpers';

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
            const stateChange = cStateCall(comp, s.expression);
            return stateChange || cloneDeep(s);
        }
        if (ts.isReturnStatement(s)) {
            return;
        }
        if (ts.isVariableStatement(s)) {
            const vars = volatileVars(comp, s).map(v =>
                replaceFunc(v, comp, params as string[], defined)
            ).filter(i => i) as ts.VariableDeclaration[];
            return vars?.length
                ? ts.createVariableStatement(s.modifiers, ts.createNodeArray(vars))
                : undefined;
        }
        return cloneDeep(s);
    }).filter(i => i) as ts.Statement[];

    if (modified.length === 0 && defined.size === 0) {
        return;
    }

    const state = destructureState(
        usedInScope(comp, comp.aggregatedVariables)
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
            && asCode(v.name) in comp.aggregatedVariables.accessed
    );
    return withoutStores;

    // if (withoutStores.length) {
    //     return ts.createVariableStatement(vars.modifiers,
    //         ts.createNodeArray(withoutStores.map(v => cloneDeep(v)!)));
    // } else {
    //     return undefined;
    // }
};

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));

function replaceFunc(v: ts.VariableDeclaration, comp: CompDefinition, params: any[], defined: Set<string>) {
    if (isFunc(v)) {
        const def = comp.functions.find(f => f.sourceAstNode === v.initializer);
        if (postAnalysisData.read(def!, 'handlerOf')) {
            return;
        }
        const name = postAnalysisData.read(def!, 'name')!;
        const _params = cleanParams([params[0], params[1], VOLATILE])
            .map(p => asCode(p.name)).join(',');
        defined.add(name);
        const clone = ts.getMutableClone(v);
        clone.initializer = asAst(`this.${name} || ((...args)=>${comp.name}.prototype._${name}(${_params}, ...args))`) as ts.Expression;

        // cArrow([cSpreadParams('args')],
        //     cCall([comp.name, 'prototype', asCode(v.name), 'call'],
        //         [
        //             ts.createThis(),
        //             params[0] ? ts.createIdentifier(params[0] as string) : ts.createNull(),
        //             params[1] ? ts.createIdentifier(params[1] as string) : ts.createNull(),
        //             ts.createIdentifier(VOLATILE),
        //             ts.createSpread(ts.createIdentifier('args'))
        //         ]));
        return clone;
    } else {
        defined.add(asCode(v.name));
        return cloneDeep(v);
    }
}