
import { Visitor } from '../astUtils/scanner';
import { isTsFunction } from '../analyzers/types';


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

