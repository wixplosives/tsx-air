import { expect } from 'chai';
import { asSourceFile } from '../astUtils/parser';
import { filterResults } from './types.helpers';
import { scan } from '../astUtils/scanner';
import { importStatement } from './imports';
import { analyze, TsxFile } from '.';
// tslint:disable: no-unused-expression

describe('importsAnalayzer', () => {
    it('should find all the import definitions', () => {
        const file = asSourceFile(`
        import defaultExport from 'aLibrary';
        import defaultWithNamed, {named, renamed as alias} from './a-module';
        import * as All from 'anotherLibrary';
        `);
        const scanRes = analyze(file).tsxAir as TsxFile;

        expect(scanRes.imports.length).to.equal(3);
        const firstImport = scanRes.imports[0];
        const secondImport = scanRes.imports[1];
        const thirdImport = scanRes.imports[2];

        expect(firstImport.defaultLocalName).to.equal('defaultExport');
        expect(firstImport.module).to.equal('aLibrary');
        expect(firstImport.imports.length).to.equal(0);


        expect(secondImport.defaultLocalName).to.equal('defaultWithNamed');
        expect(secondImport.module).to.equal('./a-module');
        expect(secondImport.imports.length).to.equal(2);
        expect(secondImport.imports[0].localName).to.equal('named');
        expect(secondImport.imports[0].localName).to.equal('named');
        expect(secondImport.imports[1].importedName).to.equal('renamed');
        expect(secondImport.imports[1].localName).to.equal('alias');


        expect(thirdImport.defaultLocalName).to.equal('All');
        expect(thirdImport.module).to.equal('anotherLibrary');
        expect(thirdImport.imports.length).to.equal(0);
    });


});