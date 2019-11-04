import { parseValue } from '../astUtils/parser';
import { expect } from 'chai';
import { compDefinition } from './comp-definition';

describe('TSXAir component definition', () => {
    describe('trivial component', () => {
        it('should return a TrivialComponentDefinition', () => {
            const ast = parseValue(`TSXAir(() => <div />)`);
            const result = compDefinition(ast);
            expect(result).to.deep.include({
                kind: 'TrivialComponentDefinition',
                name: undefined                
            });   
        });
        it('should return a TrivialComponentDefinition', () => {
            const ast = parseValue(`const Comp = TSXAir(() => <div />)`);
            const result = compDefinition(ast);
            expect(result).to.deep.include({
                kind: 'TrivialComponentDefinition',
                name: 'Comp'                
            });   
        });
    });
   
});