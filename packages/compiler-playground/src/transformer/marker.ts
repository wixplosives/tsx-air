import { PointsOfInterest } from './scanner';
import * as _ from 'lodash';

export const insert = (source: string, index: number, insertStr: string) => source.slice(0, index) + insertStr + source.slice(index);

export const sourceWithNotes = (source: string, notes: PointsOfInterest[]) => {
    let result = source;
    const sorted = notes.filter(({ note }) => _.isString(note)).sort(
        (a, b) => b.node.getStart() - a.node.getStart()
    );

    sorted.forEach(({ note, node }) => result = insert(result, node.getStart(), note));
    return result;
};

