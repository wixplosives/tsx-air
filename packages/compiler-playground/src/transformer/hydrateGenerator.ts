import { ScannedJSX } from './types';
import ts from 'typescript';
import { isComponent } from './utils';
export const createToHydrateMethod = (root: ScannedJSX) => {
    return ts.createMethod(undefined, undefined, undefined, 'hydrate', undefined, undefined, [
        ts.createParameter(undefined, undefined, undefined, 'element'),
        ts.createParameter(undefined, undefined, undefined, 'props'),
        ts.createParameter(undefined, undefined, undefined, 'state'),
    ], undefined, createHydrateBlock(root));
};


function createHydrateBlock(root: ScannedJSX) {
    const hydratableParts = getHydrateParts(root);

    return ts.createBlock(
        [
            ts.createReturn(ts.createObjectLiteral(
                hydratableParts.map(item => {
                    const path = item.path.length ? ['element'].concat(item.path.map(num => `childElements[${num}]`)).join('.') : 'element';
                    return ts.createPropertyAssignment(item.key,
                        isComponent(item) ?
                            ts.createCall(ts.createIdentifier('hydrate'), undefined, [
                                ts.createIdentifier(item.type),
                                ts.createIdentifier(path)
                            ]) :
                            ts.createIdentifier(path)
                    );

                })))
        ],
        true
    );
}

function getHydrateParts(root: ScannedJSX): ScannedJSX[] {
    const res = root.children.reduce((children, child) => {
        if (child.kind === 'jsx') {
            children.push(...getHydrateParts(child));
        }
        return children;
    }, [] as ScannedJSX[]);
    if (isComponent(root) || root.attributes.find(attr => typeof attr.value !== 'string')) {
        res.unshift(root);
    }
    return res;
}

