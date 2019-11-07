import { expect } from 'chai';
import { analyze } from '.';
import { parseValue, asSourceFile } from '../astUtils/parser';
import { TsxFile } from './types';

describe('analyze', () => {
    describe('file', () => {
        it('should fins all the component definitions', () => {
            const file = asSourceFile('const Comp1 = TSXAir(() => <div>TsxAir Component</div>)); const Comp2 = TSXAir(() => <div>TsxAir Component</div>))')
            const result = analyze(file) as TsxFile;
            expect(result.kind).to.equal('file');
            expect(result.compDefinitions).to.have.length(2);
            expect(result.compDefinitions[0].name).to.equal('Comp1');
            expect(result.compDefinitions[1].name).to.equal('Comp2');
        });
    });

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