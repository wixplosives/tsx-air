import { NodeMetaData } from './scanner';
import * as _ from 'lodash';
import { isString } from 'lodash';
import ts from 'typescript';

export const insert = (source: string, index: number, insertStr: string | object) =>
    source.slice(0, index) +
    (isString(insertStr)
        ? insertStr
        : `/* ${JSON.stringify(insertStr)} */ `)
    + source.slice(index);

export const sourceWithNotes = (source: string, notes: NodeMetaData[], offset = 0) => {
    let result = source;
    const sorted = notes.sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );

    sorted.forEach(({ metadata, node }) => result = insert(result, node.getStart() - offset, metadata));
    return result;
};

export const sourceWithHighlights = (source: string, notes: NodeMetaData[]) => {
    let result = source;
    const sorted = notes.filter(({ metadata }) => _.isString(metadata)).sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );

    sorted.forEach(({ metadata, node }) => result = insert(result, node.getStart(), metadata));

    return result;
};

export const transpileNode = <T>(source: ts.Node,
    nodesToStringify: Array<NodeMetaData<T>>,
    stringify: (childToModify: NodeMetaData<T>) => string|void) => {
    const offset = source.getStart();
    const sorted = nodesToStringify.sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );
    return sorted.reduce((res, childToStringify) =>
        res.slice(0, childToStringify.node.getStart() - offset) + (stringify(childToStringify) || childToStringify) + res.slice(childToStringify.node.getEnd() - offset), source.getText());
};