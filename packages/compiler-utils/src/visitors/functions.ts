
import { Visitor } from '../ast-utils/scanner';
import { isTsFunction } from '../analyzers/types.is.type';


export const findFunction: Visitor = (node, { ignoreChildren }) => {
    if (
        isTsFunction(node)
    ) {
        ignoreChildren();
        return {
            type: 'function'
        };
    }
    return undefined;
};

