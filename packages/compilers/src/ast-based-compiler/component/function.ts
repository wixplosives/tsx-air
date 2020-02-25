import { findUsedVariables, CompDefinition, FuncDefinition, createBitWiseOr, cloneDeep, cCall, cArrow, cMethod, cReturnLiteral, printAstText } from '@tsx-air/compiler-utils';
import flatMap from 'lodash/flatMap';
import ts from 'typescript';
import get from 'lodash/get';
import { propsAndStateParams } from './helpers';

export function generateStateAwareFunction(comp: CompDefinition, func: FuncDefinition) {
    const clone = withBlockBody(func.sourceAstNode);
    const { statements } = (clone.body as ts.Block);
    clone.body.statements = ts.createNodeArray(statements.map(s => {
        if (isStoreDefinition(comp, s)) {
            throw new Error('stores may only be declared in the main component body');
        }
        if (ts.isExpressionStatement(s)) {
            return cStateCall(comp, s.expression, false) || s;
        }
        if (ts.isReturnStatement(s) && s.expression) {
            return cStateCall(comp, s.expression, false) || s;
        }
        return s;
    }));
    return clone;
}

export function extractPreRender(comp: CompDefinition, removeStateChanges = false): ts.MethodDeclaration {
    const statements =
        get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
    const params = propsAndStateParams(comp);
    if (!statements?.length) {
        return cMethod('$preRender', [], [cReturnLiteral([])]);
    }

    const defined = new Set<string>();

    const modified = statements.map(s => {
        if (ts.isExpressionStatement(s)) {
            const stateChange = cStateCall(comp, s.expression, true);
            if (removeStateChanges && stateChange) {
                return;
            }
            return stateChange || cloneDeep(s);
        }
        if (ts.isReturnStatement(s)) {
            return;
        }
        if (ts.isVariableStatement(s)) {
            const vars = volatileVars(comp, s);
            if (vars) {
                vars.declarationList.declarations.forEach(
                    v => defined.add(printAstText(v.name)));
                return vars;
            }
            return;
        }
        return cloneDeep(s);
    }).filter(i => i) as ts.Statement[];

    modified.push(cReturnLiteral([...defined.values()]));
    return cMethod(
        '$preRender', params, modified
    );
}

const volatileVars = (comp: CompDefinition, vars: ts.VariableStatement) => {
    const noFuncs = vars.declarationList.declarations.filter(v =>
        !v.initializer ||
        !ts.isArrowFunction(v.initializer) &&
        !ts.isFunctionExpression(v.initializer) &&
        !isStoreDefinition(comp, v)
    );

    if (noFuncs.length) {
        return ts.createVariableStatement(vars.modifiers,
            ts.createNodeArray(noFuncs.map(v => cloneDeep(v)!)));
    } else {
        return undefined;
    }
};

interface ArrowFunctionWithBlockBody extends ts.ArrowFunction {
    body: ts.FunctionBody;
}

function withBlockBody(src: ts.ArrowFunction | ts.FunctionExpression): ArrowFunctionWithBlockBody {
    const clone = cloneDeep(src);
    if (!ts.isBlock(clone.body!)) {
        clone.body = ts.createBlock([ts.createReturn(clone.body)]);
    }
    if (ts.isFunctionExpression(src)) {
        return ts.createArrowFunction(
            undefined,
            clone.typeParameters, clone.parameters, clone.type,
            undefined,
            clone.body
        ) as ArrowFunctionWithBlockBody;
    }
    return clone as ArrowFunctionWithBlockBody;
}

function isStoreDefinition(comp: CompDefinition, node: ts.Statement | ts.VariableDeclaration) {
    if (ts.isVariableStatement(node)) {
        const used = findUsedVariables(node);
        return comp.stores.some(store => used.defined[store.name]);
    }
    if (ts.isVariableDeclaration(node)) {
        const name = printAstText(node.name);
        return comp.stores.some(store => store.name === name);
    }
    return false;
}

const cStateCall = (comp: CompDefinition, exp: ts.Expression, preRender: boolean) => {
    const used = findUsedVariables(exp);
    const changeBits = flatMap(used.modified,
        (v, m) => Object.keys(v).map(k => `${m}.${k}`));

    return changeBits.length === 0
        ? undefined
        : ts.createExpressionStatement(cCall(['TSXAir', 'runtime', 'updateState'],
            [
                ts.createThis(),
                cArrow([ts.createObjectBindingPattern(
                    comp.stores.map(s =>
                        ts.createBindingElement(
                            undefined,
                            undefined,
                            ts.createIdentifier(s.name),
                        )
                    ))], ts.createBlock(
                        [
                            ts.createExpressionStatement(cloneDeep(exp, undefined)),
                            ts.createReturn(createBitWiseOr(comp.name!, changeBits, preRender
                                ? ['preRender']
                                : undefined))
                        ],
                        true
                    )
                )
            ]
        ));
};
