import { parseStatement } from './../ast-utils/parser';
import { expect } from 'chai';
import { analyze } from '.';
import { parseValue, asSourceFile } from '../ast-utils/parser';
import { TsxFile, CompDefinition } from './types';
import { hasError } from './types.is.type';
// tslint:disable: no-unused-expression

describe('analyze', () => {
    describe('file', () => {
        it('should fins all the component definitions', () => {
            const file = asSourceFile('const Comp1 = TSXAir(() => <div>TsxAir Component</div>)); const Comp2 = TSXAir(() => <div>TsxAir Component</div>))');
            const result = analyze(file).tsxAir as TsxFile;
            expect(result.kind).to.equal('file');
            expect(result.compDefinitions).to.have.length(2);
            expect(result.compDefinitions[0].name).to.equal('Comp1');
            expect(result.compDefinitions[1].name).to.equal('Comp2');
        });
    });

    describe('invalid input node', () => {
        it('should return an TsxAirError for unidentified nodes', () => {
            const result = analyze(parseValue('Strings are not interesting to analyze')).tsxAir;
            expect(hasError(result)).to.be.true;
            expect(result.errors![0].message).to.equal('Unidentified node');
        });

        it('should return an TsxAirError for undefined nodes', () => {
            // @ts-ignore
            const result = analyze(null).tsxAir;
            expect(result.kind).to.equal('error');
            expect(result.errors![0].message).to.equal('undefined or null node');
        });
    });

    describe('valid input node identification', () => {
        it('should identify TsxAir component definition', () => {
            const ast = parseStatement('const Comp=TSXAir(() => <div>TsxAir Component</div>))');
            const result = analyze(
                // @ts-ignore
                ast.declarationList.declarations[0].initializer
            ).tsxAir;
            expect(result.kind).to.equal('CompDefinition');
        });
    });

    describe('astToTsxAir', () => {
        it('should collect all referenced AST nodes', () => {
            const ast = parseStatement(`const Comp=TSXAir(() => <div>TsxAir Component{'with expression'}</div>))`);
            const { tsxAir, astToTsxAir } = analyze(
                // @ts-ignore
                ast.declarationList.declarations[0].initializer
            );
            expect(astToTsxAir.size).to.equal(3);
            expect(astToTsxAir.get(
                // @ts-ignore
                ast.declarationList.declarations[0].initializer
            )).to.deep.equal([tsxAir]);
            const jsxRoot = (tsxAir as CompDefinition).jsxRoots[0];
            expect(astToTsxAir.get(jsxRoot.sourceAstNode)).to.deep.equal([jsxRoot]);
            const expression = jsxRoot.expressions[0];
            expect(astToTsxAir.get(expression.sourceAstNode)).to.deep.equal([expression]);
        });
    });
});