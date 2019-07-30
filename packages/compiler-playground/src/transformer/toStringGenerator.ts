import { ScannedJSX, ScannedChild } from './types';
import ts from 'typescript';
import { isComponent } from './utils';
export const createToStringMethod = (root: ScannedJSX) => {
    return ts.createMethod(undefined, undefined, undefined, 'toString', undefined, undefined, [
        ts.createParameter(undefined, undefined, undefined, 'props'),
        ts.createParameter(undefined, undefined, undefined, 'state'),
    ], undefined, ts.createBlock(
        [ts.createReturn(
            createStringTemplate(root))],
        true
    ));
};


function createStringTemplate(root: ScannedJSX) {
    const parts = getStringParts(root);
    const mergedParts = parts.reduce((accum, item) => {
        if (typeof item === 'string') {
            const last = accum[accum.length - 1];
            if (typeof last === 'string') {
                accum[accum.length - 1] += item;
                return accum;
            }
        }
        accum.push(item);
        return accum;
    }, [] as Array<string | { expression: string }>);
    const resSpans: ts.TemplateSpan[] = [];
    for (let i = 1; i < mergedParts.length; i += 2) {
        resSpans.push(ts.createTemplateSpan(
            ts.createIdentifier((mergedParts[i] as any).expression),
            (i === mergedParts.length - 2) ?
                ts.createTemplateTail(mergedParts[i + 1] as string) :
                ts.createTemplateMiddle(mergedParts[i + 1] as string)
        ));
    }

    return ts.createTemplateExpression(
        ts.createTemplateHead(mergedParts[0] as string),
        resSpans
    );
}


function getStringParts(root: ScannedChild): Array<string | { expression: string }> {
    const res: Array<string | { expression: string }> = [];
    switch (root.kind) {
        case 'expression':
            return [{ expression: root.expression }];
        case 'jsx':
            if (isComponent(root)) {
                res.push({
                    expression: `${root.type}.toString({
                        ${root.attributes.map(attr => `
                            ${attr.name}: ${typeof attr.value === 'string' ? attr.value : attr.value.expression}`).join(',')}
                    })`
                });
            } else {
                res.push(`\n<${root.type} `);
                for (const attr of root.attributes) {
                    const value = attr.value;
                    if (typeof value === 'string') {
                        res.push(attr.name + '=' + attr.value + ' ');
                    } else {

                        res.push(attr.name + '="');
                        res.push({
                            expression: value.expression
                        });
                        res.push('" ');
                    }
                }
                res.push(`>\n`);
                for (const child of root.children) {
                    res.push(...getStringParts(child));
                }
                res.push(`\n</${root.type}>\n`);
            }


            break;
        case 'text':
            return [root.text];
    }


    return res;
}