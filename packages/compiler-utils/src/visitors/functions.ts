
import { Visitor } from '../ast-utils/scanner';
import { isTsFunction } from '../analyzers/types.is.type';
import ts from 'typescript';


export const findFunction: Visitor = (node, { ignoreChildren }) => {
    if (
        isTsFunction(node)
    ) {
        ignoreChildren();
        return {
            type: 'function'
        };
    }
    if (ts.isJsxElement(node)) {
        ignoreChildren();
    }
    return undefined;
};

export const findHandlers: Visitor = (node, { ignoreChildren }) => {
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

