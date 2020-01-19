import { exampleSrcPath } from '@tsx-air/examples';
import { expect } from 'chai';
import { join } from 'path';
import { loadSuite } from './load.suite';

describe('loadSuite', () => {
    it('should fail if the example is not found', ()=>{
        expect(() => loadSuite('Missing example')).to.throw(/^(Invalid example path: did not find) \".*(Missing example)[\/\\]suite.ts/);        
    });

    it('should load a test suite of an example', ()=>{
        const suite = loadSuite('01.stateless-parent-child');
        expect(suite.path).to.equal(join(__dirname, '../../examples/src/examples', '01.stateless-parent-child'));
        expect(suite.suite).to.be.a('function');
    });
});