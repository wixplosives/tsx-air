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
