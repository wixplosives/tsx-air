import { cObject, cIf, cAccess, CompDefinition } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';

export const generateChangeBitMask = (comp: CompDefinition) => {
    const fields: Record<string, ts.BinaryExpression> = {};
    const props = comp.usedProps.map(p => p.name);
    const stores = flatMap(comp.stores, store => store.keys.map(key => `${store.name}_${key}`));
    [...props, ...stores].forEach((name, index) => {
        fields[name] = ts.createBinary(ts.createNumericLiteral('1'),
            ts.SyntaxKind.LessThanLessThanToken,
            ts.createNumericLiteral(index.toString()));
    });
    return cObject(fields);
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
    return cIf(ts.createBinary(
        ts.createIdentifier(options.changedMaskName),
        ts.createToken(ts.SyntaxKind.AmpersandToken),
        cAccess(...options.maskPath, checkedFlag)
    ), statements);
};