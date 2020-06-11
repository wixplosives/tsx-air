import { CompDefinition, asAst, asCode } from "@tsx-air/compiler-utils/src";
import { createChangeBitMask } from "./bitmask";
import { generateInitialState } from "./factory/initial.state";
import ts from "typescript";

export function factory(comp: CompDefinition) {
    const { name } = comp;
    return asAst(`new CompFactory(${name}, 
        ${createChangeBitMask(comp)}, 
        ${asCode(generateInitialState(comp))});`) as ts.Expression;
}