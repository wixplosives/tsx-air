import { cObject, cIf, CompDefinition } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import sortBy from 'lodash/sortBy';
import { accessedVars } from './helpers';

export const generateChangeBitMask = (comp: CompDefinition) => {
    const fields: Record<string, ts.BinaryExpression> = {};
    const vars = accessedVars(comp);
    sortBy(vars).forEach((name, index) => {
        fields[name] = ts.createBinary(ts.createNumericLiteral('1'),
            ts.SyntaxKind.LessThanLessThanToken,
            ts.createNumericLiteral(index.toString()));
    });
    return cObject(fields);
};

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