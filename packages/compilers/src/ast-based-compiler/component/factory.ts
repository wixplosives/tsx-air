import { CompDefinition, asAst, asCode } from '@tsx-air/compiler-utils/src';
import { generateInitialState } from './factory/initial.state';
import ts from 'typescript';
import { getChangeBitsNames, dependantOnVars } from './helpers';

export function factory(comp: CompDefinition) {
    const { name } = comp;
    return asAst(`new CompFactory(${name}, 
        ${getBits(comp)}, 
        ${asCode(generateInitialState(comp))});`) as ts.Expression;
}

function getBits(comp: CompDefinition) {
    const vars = dependantOnVars(comp, comp.aggregatedVariables);
    const bits = getChangeBitsNames(vars);
    return `{${bits.map((v, i) => `'${v}':1<<${i}`).join(',')}}`;
}