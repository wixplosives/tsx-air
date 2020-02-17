import ts from 'typescript';
import { isFunction, isNumber } from 'lodash';
export { tsKindInverse } from '@tsx-air/compiler-utils';

export const getProps = (node: ts.Node) => {
    const ret: any = {};
    for (const k in node) {
        // @ts-ignore
        if (k && node[k] && !k.startsWith('_') && !isFunction(node[k])
            && k !== 'children' && k !== 'parent' && k !== 'symbol'
            && k !== 'flowNode' && k !== 'transformFlags' && k !== 'kind'
            && k !== 'modifierFlagsCache'
        ) {
            // @ts-ignore
            const v: any = node[k];
            if (isFunction(v.getText)) {
                ret[k] = v.getText();
                continue;
            }
            if (!isNumber(v.length)) {
                ret[k] = v;
            }
        }
    }
    return ret;
};