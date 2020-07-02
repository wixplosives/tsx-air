import { cIf, CompDefinition } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import sortBy from 'lodash/sortBy';
import { readVars } from './helpers';

export const createChangeBitMask = (comp: CompDefinition) => {
    const fields: Record<string, number> = {};
    const vars = readVars(comp);
    sortBy(vars).forEach((name, index) => fields[name] = 1 << index);
    return JSON.stringify(fields);
};

// TODO remove
export const cBitMaskIf =
    (checkedFlag: string, comp: string, statements: ts.Statement[]) => {
        return cIf(ts.createBinary(
            ts.createIdentifier('changeMap'),
            ts.createToken(ts.SyntaxKind.AmpersandToken),
            ts.createElementAccess(
                ts.createIdentifier(`${comp}.changeBitmask`),
                ts.createStringLiteral(checkedFlag)
            ),
        ), statements);
    };