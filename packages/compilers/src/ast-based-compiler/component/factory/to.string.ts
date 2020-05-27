import { destructureState, destructureVolatile, dependantOnVars, getGenericMethodParamsByUsedInScope, compFuncByName, mergeRefMap } from '../helpers';
import {
    cArrow,
    jsxToStringTemplate,
    jsxAttributeNameReplacer,
    jsxAttributeReplacer,
    CompDefinition,
    cCall,
    jsxSelfClosingElementReplacer,
    jsxEventHandlerRemover,
    cConst,
    findUsedVariables,
    UsedInScope
} from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { VOLATILE, STATE, PROPS } from '../../consts';
import { defaultsDeep } from 'lodash';
import { jsxTextExpressionReplacer, jsxComponentReplacer } from './template.replacers';

export const generateToString = (comp: CompDefinition) => {
    const executedFuncs = [] as string[];
    const templates = comp.jsxRoots.map(jsx => jsxToStringTemplate(jsx.sourceAstNode, [
        jsxComponentReplacer,
        jsxEventHandlerRemover,
        jsxTextExpressionReplacer(comp, executedFuncs),
        jsxAttributeReplacer,
        jsxAttributeNameReplacer,
        jsxSelfClosingElementReplacer
    ]));

    const usedVars = mergeRefMap({}, 
        ...templates.map(t => dependantOnVars(comp, findUsedVariables(t), true)));
    
    const usedByFuncs:UsedInScope = {};
    executedFuncs.forEach(f => {
        const func = compFuncByName(comp, f);
        if (func) {
            defaultsDeep(usedByFuncs, dependantOnVars(comp, func.aggregatedVariables));
        }
    }); 

    const hasCompMethodCalls = executedFuncs.length > 0;

    let [propsParam, stateParams] = getGenericMethodParamsByUsedInScope(usedVars, true, !hasCompMethodCalls);
    if (!usedVars.volatile && !hasCompMethodCalls) {
        return cArrow([propsParam, stateParams], templates[0]);
    }

    const destructured = [destructureState(usedVars), destructureVolatile(usedVars)].filter(
        i => i
    ) as ts.VariableStatement[];

    if (usedByFuncs.stores || usedVars.stores) {
        stateParams = STATE;
    }
    if (usedByFuncs.props || usedVars.props) {
        propsParam = comp.propsIdentifier || PROPS;
    } else {
        propsParam = stateParams ? '__0' : undefined;
    }
   
    const volatile = cConst(
        VOLATILE,
        cCall(
            ['TSXAir', 'runtime', 'toStringPreRender'],
            [comp.name,  propsParam , stateParams].filter(i => i).map(i => ts.createIdentifier(i as string))
        )
    );
    if (stateParams) {
        return cArrow([propsParam, stateParams], [volatile, ...destructured, ts.createReturn(templates[0])]);
    } else {
        return cArrow(propsParam ? [propsParam]:[], [volatile, ...destructured, ts.createReturn(templates[0])]);
    }
};

export const jsxTextExpressionReplacer: (comp: CompDefinition, executedFuncs: string[]) => AstNodeReplacer = (comp, executedFuncs) => node => {
    const swapCalls = (exp: ts.JsxExpression): ts.Expression => {
        const toProto = (n: ts.Node) => {
            const clone = ts.getMutableClone(n);
            if (ts.isCallExpression(n)) {
                const args: Array<ts.Identifier | ts.Expression> = getGenericMethodParams(
                    comp,
                    findUsedVariables(n),
                    true,
                    false
                ).map(u => (u ? ts.createIdentifier(u as string) : ts.createIdentifier('undefined')));
                n.arguments.forEach(a => args.push(cloneDeep(a) as ts.Identifier | ts.Expression));
                const name = asCode(n.expression);
                executedFuncs.push(name);
                return cCall([comp.name, 'prototype', `_${name}`], args);
            }
            clone.forEachChild(toProto);
            return clone;
        };
        return toProto(exp) as ts.Expression;
    };

    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
        const expression = node.expression ? swapCalls(node.expression as ts.JsxExpression) : ts.createTrue();

        return {
            prefix: `<!-- ${node.expression ? asCode(node.expression) : 'empty expression'} -->`,
            expression,
            suffix: `<!-- -->`
        };
    } else {
        return false;
    }
};

export const jsxComponentReplacer: AstNodeReplacer = node => {
    if (
        (ts.isJsxElement(node) && isComponentTag(node.openingElement.tagName)) ||
        (ts.isJsxSelfClosingElement(node) && isComponentTag(node.tagName))
    ) {
        const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = printAst(openingNode.tagName);

        return {
            expression: cCall(
                [tagName, 'factory', 'toString'],
                [
                    cObject(
                        openingNode.attributes.properties.reduce((acc, prop) => {
                            if (ts.isJsxSpreadAttribute(prop)) {
                                throw new Error('spread in attributes is not handled yet');
                            }
                            const initializer = prop.initializer;
                            const name = printAst(prop.name);
                            if (!initializer) {
                                acc[name] = ts.createTrue();
                            } else if (ts.isJsxExpression(initializer)) {
                                if (initializer.expression) {
                                    acc[name] = cloneDeep(initializer.expression);
                                }
                            } else {
                                acc[name] = cloneDeep(initializer);
                            }
                            return acc;
                        }, {} as Record<string, any>)
                    )
                ]
            )
        };
    }
    return false;
};
