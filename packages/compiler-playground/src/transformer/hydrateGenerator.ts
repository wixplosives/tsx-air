import { ScannedJSX, ScannedChild } from './types';
import ts from 'typescript';
import { isComponent } from './utils';
export const createToHydrateMethod = (root: ScannedJSX) => {
    return ts.createMethod(undefined, undefined, undefined, 'hydrate', undefined, undefined, [
        ts.createParameter(undefined, undefined, undefined, 'props'),
        ts.createParameter(undefined, undefined, undefined, 'state'),
    ], undefined, createHydrateBlock(root));
};


function createHydrateBlock(root: ScannedJSX) {
    const hydratableParts = getHydrateParts(root, []);

    return ts.createBlock(
        [...hydratableParts.map(item=>{
            if(item.isComponent){
                item.
            }
        })],
        true
    );
}

function getHydrateParts(root: ScannedJSX, path: number[]): Array<{isComponent: boolean, tagName:string, path: number[]}>{
    const res = root.children.reduce((children, child, idx)=>{
        if(child.kind === 'jsx'){
            children.push(...getHydrateParts(child, path.concat(idx)));
        }
        return children;
    }, [] as Array<{isComponent: boolean, tagName:string, path: number[]}>);
    if(isComponent(root) || root.attributes.find(attr=>typeof attr.value!=='string')){

        res.unshift({
            isComponent: isComponent(root),
            path,
            tagName: root.type
        });
    }
    return res;
}

