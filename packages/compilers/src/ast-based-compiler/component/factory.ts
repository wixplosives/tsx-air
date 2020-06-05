import { CompDefinition, asAst, asCode } from "@tsx-air/compiler-utils/src";
import { generateChangeBitMask } from "./bitmask";
import { generateInitialState } from "./factory/initial.state";

export function factory(comp:CompDefinition) {
    const {name} = comp;
    return asAst(`static factory=new CompFactory<${name}>(${name}, 
        ${generateChangeBitMask}, 
        ${asCode(generateInitialState(comp))});`);
}