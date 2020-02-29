import { CompDefinition, cMethod, cReturnLiteral, cloneDeep, printAstText } from '@tsx-air/compiler-utils';
import { propsAndStateParams } from './helpers';
import ts from 'typescript';
import { cStateCall, isStoreDefinition } from './function';
import get from 'lodash/get';

export function generatePreRender(comp: CompDefinition, staticVersion: boolean): ts.MethodDeclaration | undefined {
    const statements =
        get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
    const params = propsAndStateParams(comp);
    if (!statements?.length) {
        return;
    }

    const defined = new Set<string>();

    const modified = statements.map(s => {
        if (ts.isExpressionStatement(s)) {
            if (!staticVersion) {
                const stateChange = cStateCall(comp, s.expression, true);
                return stateChange || cloneDeep(s);
            }
            return cloneDeep(s);
        }
        if (ts.isReturnStatement(s)) {
            return;
        }
        if (ts.isVariableStatement(s)) {
            if (ts.isVariableStatement(s)) {
                const vars = volatileVars(comp, s);
                if (vars) {
                    vars.declarationList.declarations.forEach(
                        v => defined.add(printAstText(v.name)));
                    return vars;
                }
                return;
            }
        }
        return cloneDeep(s);
    }).filter(i => i) as ts.Statement[];

    if (modified.length === 0 && defined.size === 0) {
        return;
    }
    modified.push(cReturnLiteral([...defined.values()]));
    return cMethod(
        '$preRender', params, modified, staticVersion
    );
}

const volatileVars = (comp: CompDefinition, vars: ts.VariableStatement) => {
    const noFuncs = vars.declarationList.declarations.filter(v =>
        !v.initializer ||
        (!ts.isArrowFunction(v.initializer) &&
            !ts.isFunctionExpression(v.initializer) &&
            !isStoreDefinition(comp, v))
    );

    if (noFuncs.length) {
        return ts.createVariableStatement(vars.modifiers,
            ts.createNodeArray(noFuncs.map(v => cloneDeep(v)!)));
    } else {
        return undefined;
    }
};
