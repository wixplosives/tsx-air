import { expect } from 'chai';
import { asSourceFile } from '../ast-utils/parser';
import { analyze, TsxFile } from '.';
// tslint:disable: no-unused-expression

describe('reExportAnalayzer', () => {
    it('should find all the import definitions', () => {
        // Source: https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export
        const file = asSourceFile(`
            export * from 'aLibrary'; // does not set the default export
            export * as name1 from 'renamedLib';
            export { name1, name2 } from './local';
            export { import1 as name1, import2 as name2, import3 } from '@some/pckg';
            export { default } from './other/local';
        `);
        const scanRes = analyze(file).tsxAir as TsxFile;

        expect(scanRes.reExports, 'Some supported re-exports were not analyzed').to.have.length(5);
    });
});

