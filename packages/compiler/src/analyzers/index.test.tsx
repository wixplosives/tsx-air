import { expect } from 'chai';
import { analyze } from '.';
import { parseValue } from '../astUtils/parser';

describe('analyze', () => {
    describe('invalid input node', () => {
        it('should return an TsxAirError for unidentified nodes', () => {
            const result = analyze(parseValue('Strings are not interesting to analyze'))!;
            expect(result.kind).to.equal('error');
            expect(result.errors![0].message).to.equal('unidentified node');
        });
        
        it('should return an TsxAirError for undefined nodes', () => {
            // @ts-ignore
            const result = analyze()!;
            expect(result.kind).to.equal('error');
            expect(result.errors![0].message).to.equal('undefined or null node');
        });
    });

    describe('valid input node identification', () => {
        it('should identify TsxAir component definition', () => {
            const ast = parseValue('TSXAir(() => <div>TsxAir Component</div>))');
            const result = analyze(ast)!;
            expect(result.kind).to.equal('CompDefinition');
        });
    });
});