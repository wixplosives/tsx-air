import { isTsxFile, TsxFile } from './types';
import { analyze } from './index';
import { expect } from 'chai';
import { asSourceFile } from './../astUtils/parser';
// tslint:disable: no-unused-expression

describe('sourcefile analyzer', () => {
    it('should find the imports', () => {
        const { tsxAir } = analyze(asSourceFile(`
        import {a} from './a';
        import b from './b';
        import * as C from '../c';
        `));
        expect(isTsxFile(tsxAir)).to.be.true;
        const { imports } = (tsxAir as TsxFile);
        expect(imports).to.have.length(3);
        expect(imports[0]).to.deep.include({
            kind: 'import',
            module: './a',
            imports: '{a}'
        });
        expect(imports[1]).to.deep.include({
            kind: 'import',
            module: './b',
            imports: 'b'
        });
        expect(imports[2]).to.deep.include({
            kind: 'import',
            module: '../c',
            imports: '* as C'
        });
    });
});