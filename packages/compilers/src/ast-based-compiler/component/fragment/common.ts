import { asAst, asCode, JsxComponent } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { isString } from 'lodash';

export const propsAndRtFromInstance = asAst(`const {$rt:{renderer:$rn, updater:$up}, stores:{$props}}=this;`) as ts.Statement;
export const propsFromInstance = asAst(`const {stores:{$props}}=this;`) as ts.Statement;

export const prop = (value: string | ts.Node) => {
    if (!isString(value)) {
        value = asCode(value);
    }
    return `$props[${toCanonicalString(value)}]`;
};

export const toCanonicalString = (str: string) => JSON.stringify(str.replace(/"/g, "'").replace(/\s+/g,''));

export const usedProps = (exp: JsxComponent) => {
    const read = [];
    for (const [store, val] of Object.entries(exp.variables.read)) {
        for (const key of Object.keys(val)) {
            read.push(JSON.stringify(store + '.' + key));
        }
    }
    return read;
};