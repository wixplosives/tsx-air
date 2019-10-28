import { scan } from './../../astUtils/scanner';
import * as ts from 'typescript';
import { TSXAirData } from '../../visitors/tsxair';
import { findJsxExpression, findJsxRoot, findJsxComponent } from '../../visitors/jsx';
import { sourceWithNotes } from '../../astUtils/marker';

export const toString = (node: ts.Node, tsxAirData: TSXAirData) => {
    const returnedJsx = scan(node, findJsxRoot);
    if (returnedJsx.length > 1) {
        throw new Error('Multiple JSX root not supported (YET)');
    }
    if (returnedJsx.length === 0) {
        throw new Error('No JSX root returned');
    }
    const jsx = returnedJsx[0].node;
    const expressions = scan(jsx, findJsxExpression);
    // const comps = scan(jsx, findJsxComponent);
    // comps.forEach(({node})=> {
    //     node.
    // })
    return `(${tsxAirData.propsIdentifier})=>\`${sourceWithNotes(jsx.getText(), expressions, jsx.getStart())}\``;
};