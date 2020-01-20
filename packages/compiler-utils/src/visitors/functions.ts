
import { Visitor } from '../astUtils/scanner';
import { isTSFunction } from '../analyzers/types';


export const findFunction: Visitor = (node, { ignoreChildren }) => {
    if (
        isTSFunction(node)
    ) {
        ignoreChildren();
        return {
            type: 'function'
        };
    }
    return undefined;
};

