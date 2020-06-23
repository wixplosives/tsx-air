import isString from 'lodash/isString';
import { asCode } from '@tsx-air/compiler-utils/src/dev-utils';
import ts from 'typescript';

export * from './safely';
export * from './commonjs';
export * from './type.check';
export * from './promises';
export * from './filenames';

export const isComponentTag = (tag: ts.JsxTagNameExpression | string) => {
    const text = isString(tag) ? tag : asCode(tag);
    return /^([a-zA-z0-9$_]+\.)*([A-Z][a-zA-z0-9$_]*)$/.test(text);
};
