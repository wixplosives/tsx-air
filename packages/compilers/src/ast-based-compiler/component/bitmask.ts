import { cObject, CIf, cAccess } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const createChangeBitMask = (names: string[]) => {
    return cObject(names.reduce((accum, name, currentIndex) => {
        accum[name] = ts.createBinary(ts.createNumericLiteral((currentIndex + 1).toString()),
            ts.SyntaxKind.LessThanLessThanToken,
            ts.createNumericLiteral('0'));
        return accum;
    }, {} as any));
};

export interface CBitMaskIfOptions {
    changedMaskName: string;
    maskPath: string[];
}
const defaultCBitMaskIfOptions: CBitMaskIfOptions = {
    changedMaskName: 'changeMap',
    maskPath: []
};

export const cBitMaskIf = (checkedFlag: string, options: CBitMaskIfOptions = defaultCBitMaskIfOptions, statements: ts.Statement[]) => {
    return CIf(ts.createBinary(
        ts.createIdentifier(options.changedMaskName),
        ts.createToken(ts.SyntaxKind.AmpersandToken),
        cAccess(...options.maskPath, checkedFlag)
    ), statements);
};