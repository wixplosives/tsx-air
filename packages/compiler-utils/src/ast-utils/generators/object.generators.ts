import { _cAccess } from './helpers';
import { cLiteralAst } from './ast-generators';
import ts from 'typescript';

export interface AstGeneratorsOptions {
    useSingleQuatres: boolean;
    multiline: boolean;
}

export const defaultObjGenOptions: AstGeneratorsOptions = {
    useSingleQuatres: true,
    multiline: true
};


export const cAccess = (...callPath: string[]) => _cAccess(false, callPath);
export const cSafeAccess = (...callPath: string[]) => _cAccess(true, callPath);

/**
 * creates a literal pojo from a literal pojo, supports nested expressions
 */
export const cObject = (properties: Record<string, any>, options: AstGeneratorsOptions = defaultObjGenOptions) => {
    return ts.createObjectLiteral(
        Object.entries(properties).map(([name, value]) => {
            return ts.createPropertyAssignment(`"${name}"`,
                cLiteralAst(value, options));
        }), options.multiline);
};
