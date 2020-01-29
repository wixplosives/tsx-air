import { JsxRoot, CompDefinition, cArrow, cObject } from '@tsx-air/compiler-utils';

export function generateInitialState(_node: JsxRoot, _comp: CompDefinition) {
    return cArrow([], cObject({}));
}