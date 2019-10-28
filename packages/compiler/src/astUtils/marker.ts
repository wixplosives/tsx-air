import { PointsOfInterest } from './scanner';
import * as _ from 'lodash';
import { isString } from 'lodash';

export const insert = (source: string, index: number, insertStr: string | object) =>
    source.slice(0, index) +
    (isString(insertStr)
        ? insertStr
        : `/* ${JSON.stringify(insertStr)} */ `)
    + source.slice(index);

export const sourceWithNotes = (source: string, notes: PointsOfInterest[], offset=0) => {
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