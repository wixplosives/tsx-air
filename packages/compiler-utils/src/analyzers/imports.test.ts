import { expect } from 'chai';
import { asSourceFile } from '../ast-utils/parser';
import { analyze, TsxFile } from '.';
// tslint:disable: no-unused-expression

describe('importsAnalayzer', () => {
    it('should find all the import definitions', () => {
        // Source: https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/import
        const file = asSourceFile(`
            import defaultExport from "module-name1";
            import * as name from "./module-name2";
            import { export1 } from "module-name3";
            import { export1 as alias1 } from "./module/name4";
            import { export1 , export2 } from "../module.name5";
            import { foo , bar } from "module-name/path/to/specific/un-exported/file6";
            import { export1 , export2 as alias2 } from "module-name7";
            import defaultExport, { export1, export2 as alias2 } from "module-name8";
            import defaultExport, * as name from "module-name9";
            import "module-name10";
            //// NOT SUPPORTED YET
            var promise = import("dynamic-module11");
        `);
        const { imports } = analyze(file).tsxAir as TsxFile;
        expect(imports).to.have.length(10);
    });

    describe('types of imports', () => {
        it('default', () => {
            const { imports } = analyze(asSourceFile(
                `import defaultExport from "module-name1";`
            )).tsxAir as TsxFile;

            expect(imports[0]).to.deep.include({
                kind: 'import',
                defaultLocalName: 'defaultExport',
                nameSpace: undefined,
                module: 'module-name1',
                imports: []
            });
        });

        it('* as namespace', () => {
            const { imports } = analyze(asSourceFile(`
                import * as name from "./module-name2";
            `)).tsxAir as TsxFile;

            expect(imports[0]).to.deep.include({
                kind: 'import',
                defaultLocalName: undefined,
                nameSpace: 'name',
                module: './module-name2',
                imports: [],
            });
        });

        it('{a, b as alias}', () => {
            const { imports } = analyze(asSourceFile(`
                import { export1 , export2 as alias2 } from "module-name7";
            `)).tsxAir as TsxFile;

            expect(imports[0]).to.deep.include({
                kind: 'import',
                defaultLocalName: undefined,
                nameSpace: undefined,
                module: 'module-name7',
            });
            expect(imports[0].imports).to.have.length(2);
            expect(imports[0].imports[0]).to.deep.include({
                kind: 'importSpecifier',
                externalName: 'export1',
                localName: 'export1'
            });
            expect(imports[0].imports[1]).to.deep.include({
                kind: 'importSpecifier',
                externalName: 'export2',
                localName: 'alias2'
            });
        });

        it('all together now', () => {
            const { imports } = analyze(asSourceFile(`
                import defaultName, * as named from "module-name6";
                import defaultName, { export1 , export2 as alias2 } from "module-name7";
            `)).tsxAir as TsxFile;

            expect(imports[0]).to.deep.include({
                kind: 'import',
                defaultLocalName: 'defaultName',
                nameSpace: 'named',
                module: 'module-name6',
                imports: []
            });

            expect(imports[1]).to.deep.include({
                kind: 'import',
                defaultLocalName: 'defaultName',
                nameSpace: undefined,
                module: 'module-name7',
            });
            expect(imports[1].imports).to.have.length(2);
            expect(imports[1].imports[0]).to.deep.include({
                kind: 'importSpecifier',
                externalName: 'export1',
                localName: 'export1'
            });
            expect(imports[1].imports[1]).to.deep.include({
                kind: 'importSpecifier',
                externalName: 'export2',
                localName: 'alias2'
            });
        });
    });
});