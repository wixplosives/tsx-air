import { expect } from 'chai';
import { join } from 'path';
import { loadSuite } from './load.suite';
import { capitalize } from 'lodash';

describe('loadSuite', () => {
    it('should fail if the example is not found', ()=>{
        expect(() => loadSuite('Missing example')).to.throw('Error loading');        
    });

    it('should load a test suite of an example', ()=>{
        const suite = loadSuite('01.stateless-parent-child');        
        expect(suite.path.toLowerCase()).to.equal(join(__dirname, '../../examples/src/examples', '01.stateless-parent-child').toLowerCase());
        expect(suite.suite).to.be.a('function');
    });
});