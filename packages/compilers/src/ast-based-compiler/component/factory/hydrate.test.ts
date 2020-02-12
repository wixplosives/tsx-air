import { generateHydrate } from './hydrate';
import { generateDomBindings } from '@tsx-air/compiler-utils';
import { analyzeFixtureComponents } from 'packages/compilers/src/test.helpers';
import { expect } from 'chai';

describe('generateHydrate', () => {
    const [withNothing, withProps, withState, withBoth, nested] =
        analyzeFixtureComponents(`minimal.components.tsx`)
            .map(compDef =>
                generateHydrate(compDef, generateDomBindings(compDef)));

    it('should return an hydrate function AST', () => {
        expect(withNothing).to.have.astLike(`(root, props, state) => new WithNothing({
            root: root
        }, props, state)`);

        expect(withProps).to.have.astLike(`(root, props, state) => new WithProps({
            root: root,
            exp0: root.childNodes[1],
            exp1: root.childNodes[4]
         }, props, state)`);

        expect(withState).to.have.astLike(`(root, props, state) => new WithState({
            root: root,
            exp0: root.childNodes[1],
            exp1: root.childNodes[4]
         }, props, state)`);

        expect(withBoth).to.have.astLike(`(root, props, state) => new WithBoth({
            root: root,
            exp0: root.childNodes[1],
            exp1: root.childNodes[4],
            exp2: root.childNodes[7],
            exp3: root.childNodes[10]
         }, props, state)`);

        expect(nested).to.have.astLike(`(root, pr, state) => new NestedStateless({
            root: root,
            WithProps1: WithProps.factory.hydrate(
                root.childNodes[0], 
                {
                    a: pr.a,
                    b: pr.a,
                    unused: 3
                }, state)
         }, pr, state)`);
    });
});