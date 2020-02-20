import { basicPatterns } from './../../../test.helpers';
import { generateHydrate } from './hydrate';
import { generateDomBindings } from '@tsx-air/compiler-utils';
import { expect } from 'chai';
import { mapValues } from 'lodash';

describe('generateHydrate', () => {
    it('should return an hydrate function AST', () => {
        const comp = mapValues(basicPatterns(), compDef => generateHydrate(compDef, generateDomBindings(compDef)));

        expect(comp.Static).to.have.astLike(`(root, props, state) => new Static({
            root: root
        }, props, state)`);

        expect(comp.PropsOnly).to.have.astLike(`(root, props, state) => new PropsOnly({
            root: root,
            exp0: root.childNodes[1],
            exp1: root.childNodes[4]
         }, props, state)`);

        expect(comp.StateOnly).to.have.astLike(`(root, props, state) => new StateOnly({
            root: root,
            exp0: root.childNodes[1],
            exp1: root.childNodes[4]
         }, props, state)`);

        expect(comp.ProsAndState).to.have.astLike(`(root, props, state) => new ProsAndState({
            root: root,
            exp0: root.childNodes[1],
            exp1: root.childNodes[4],
            exp2: root.childNodes[7],
            exp3: root.childNodes[10]
         }, props, state)`);

        expect(comp.NestedStateless).to.have.astLike(`(root, pr, state) => new NestedStateless({
            root: root,
            PropsOnly0: PropsOnly.factory.hydrate(
                root.children[0], 
                {
                    a: pr.a,
                    b: pr.a,
                    unused: 3
                }, state && state.__childComps && state.__childComps.PropsOnly0)
         }, pr, state)`);
    });
});