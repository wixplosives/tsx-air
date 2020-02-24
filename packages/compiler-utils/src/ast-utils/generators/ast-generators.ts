import ts from 'typescript';
import isArray from 'lodash/isArray';
import { _cFunc, _cAccess } from './helpers';
import { AstGeneratorsOptions, defaultObjGenOptions, cObject, cAccess } from './object.generators';
import { cloneDeep } from '../clone.deep';

export const cArray = (items: any[], options: AstGeneratorsOptions = defaultObjGenOptions) => {
    return ts.createArrayLiteral(items.map(item => cLiteralAst(item, options)));
};

export function cLiteralAst(item: any, options: AstGeneratorsOptions = defaultObjGenOptions): ts.Expression {
    const exp = isTSNode(item) ? item :
        isArray(item) ? cArray(item, options) :
            (typeof item === 'object') ? cObject(item, options) :
                cPrimitive(item, options);

    if (exp === null) {
        throw new Error('unknown conversion');
    }
    return exp as ts.Expression;
}

export function isTSNode(node: any): node is ts.Node {
    return node && !!node.kind;
}

export const cPrimitive = (input: any, options: AstGeneratorsOptions = defaultObjGenOptions) => {
    if (typeof input === 'string') {
        const res = ts.createStringLiteral(input);
        (res as any).singleQuote = options.useSingleQuatres;
        return res;
    }
    if (typeof input === 'number') {
        return ts.createNumericLiteral(input.toString());
    }
    if (typeof input === 'boolean') {
        return input ? ts.createTrue() : ts.createFalse();
    }
    return null;
};

export const cAssign = (to: string[], from: string[] | ts.Expression) => {
    if (isTSNode(from)) {
        return ts.createStatement(
            ts.createAssignment(cAccess(...to), cloneDeep(from))
        );
    }
    return ts.createStatement(
        ts.createAssignment(cAccess(...to), cAccess(...from))
    );
};

export const createBitWiseOr = (comp: string, fields: string[], flags: string[] = []) => {
    const target: ts.Expression = cAccess(comp, 'changeBitmask');
    let res: ts.Expression;
    fields.forEach(fieldName => {
        const field = cFieldAccess(target, fieldName);
        res = res
            ? ts.createBinary(res, ts.SyntaxKind.FirstBinaryOperator, field)
            : field;
    });
    flags.forEach(flag => {
        const field = cFieldAccess('TSXAir.runtime.flags', flag);
        res = res
            ? ts.createBinary(res, ts.SyntaxKind.BarToken, field)
            : field;
    });

    return res!;
};

export const cFieldAccess = (target: string | ts.Expression, field: string | ts.StringLiteral) => {
    if (typeof target === 'string') {
        target = cAccess(...target.split('.'));
    }
    if (typeof field === 'string') {
        field = ts.createStringLiteral(field);
    }
    return ts.createElementAccess(target, field);
};

export const cIf = (condition: ts.Expression, statements: ts.Statement[]) => {
    return ts.createIf(condition, ts.createBlock(statements));
};
