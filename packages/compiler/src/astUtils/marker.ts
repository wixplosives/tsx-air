import { PointsOfInterest } from './scanner';
import * as _ from 'lodash';
import { isString } from 'lodash';
import ts from 'typescript';

export const insert = (source: string, index: number, insertStr: string | object) =>
    source.slice(0, index) +
    (isString(insertStr)
        ? insertStr
        : `/* ${JSON.stringify(insertStr)} */ `)
    + source.slice(index);

export const sourceWithNotes = (source: string, notes: PointsOfInterest[], offset = 0) => {
    let result = source;
    const sorted = notes.sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );

    sorted.forEach(({ note, node }) => result = insert(result, node.getStart() - offset, note));
    return result;
};

export const sourceWithHighlights = (source: string, notes: PointsOfInterest[]) => {
    let result = source;
    const sorted = notes.filter(({ note }) => _.isString(note)).sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );

    sorted.forEach(({ note, node }) => result = insert(result, node.getStart(), note));

    return result;
};

export const replaceNodeText = <T>(parentNode: ts.Node, points: Array<PointsOfInterest<T>>, pointStringifier: (point: PointsOfInterest<T>) => string) => {
    const parentStart = parentNode.getStart();
    const sorted = points.sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );
    return sorted.reduce((res, point) => res.slice(0, point.node.getStart() - parentStart) + pointStringifier(point) + res.slice(point.node.getEnd() - parentStart), parentNode.getText());
};