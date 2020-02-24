import { basicPatterns } from './../../../test.helpers';
import { generateInitialState } from './initial.state';
import { expect } from 'chai';
import { mapValues } from 'lodash';

describe('generateInitialState', () => {
    it('should return an initial state as defined in component', () => {
        const comp = mapValues(basicPatterns(), compDef => generateInitialState(compDef));
       
        expect(comp.Static).to.have.astLike(`() => ({})`);
        expect(comp.PropsOnly).to.have.astLike(`() => ({})`);
        expect(comp.StateOnly).to.have.astLike(`() => ({ 
            store1: { a:1, b:2 }
        })`);
        expect(comp.ProsAndState).to.have.astLike(`(props) => ({
            store2: { a:props.b, b:2 }
        })`);
    });
});