import { generateInitialState } from './initial.state';
import { analyzeFixtureComponents } from 'packages/compilers/src/test.helpers';
import { expect } from 'chai';

describe('generateInitialState', () => {
    const [withNothing, withProps, withState, withBoth] =
        analyzeFixtureComponents(`minimal.components.tsx`)
            .map(compDef => generateInitialState(compDef));

    it('should return an initial state as defined in component', () => {
        expect(withNothing).to.have.astLike(`() => ({})`);
        expect(withProps).to.have.astLike(`() => ({})`);
        expect(withState).to.have.astLike(`() => ({ 
            store1: { a:1, b:2 }
        })`);
        expect(withBoth).to.have.astLike(`(props) => ({
            store2: { a:props.b, b:2 }
        })`);
    });
});