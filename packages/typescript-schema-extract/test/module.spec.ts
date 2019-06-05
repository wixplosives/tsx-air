import { expect } from 'chai';
import { IModuleSchema } from '../src/json-schema-types';
import { transformTest } from '../test-kit/run-transform';

describe('schema-extract - module', () => {
    it('should support different export types', async () => {
        const moduleId = 'export-types';
        const res = await transformTest(
            `
                export let a:string;
                let b:string;
                let c:number;
                export {c};

                let z:number;

                let d:number = 5;
                export default (d);
                `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                a: {
                    type: 'string'
                },
                c: {
                    type: 'number'
                },
                default: {
                    type: 'number'
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    xit('should support one export mode', async () => {
        const moduleId = 'export-one';
        const res = await transformTest(
            `
        let a:string = 'b';
        exports = a;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {},
            definitions: {},
            type: 'string',
            default: 'b',
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support imports', async () => {
        const moduleId = 'imports';
        const res = await transformTest(
            `
        import { AClass } from './test-assets';

        export let a:AClass;
        let b:AClass;
        export {b};
        export let c = AClass;
        export default b`,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                a: {
                    $ref: '/src/test-assets#AClass'
                },
                b: {
                    $ref: '/src/test-assets#AClass'
                },
                c: {
                    $ref: '/src/test-assets#typeof AClass'
                },
                default: {
                    $ref: '/src/test-assets#AClass'
                }
            },
            definitions: {},
            moduleDependencies: ['/src/test-assets']
        };

        expect(res).to.eql(expected);
    });

    it('should support * as imports', async () => {
        const moduleId = 'imports';
        const res = await transformTest(
            `
        import * as stuff  from './test-assets';

        export let a:stuff.AClass;
        let b:stuff.AClass;
        export {b};
        export default b

        export let d = stuff.AClass
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                a: {
                    $ref: '/src/test-assets#AClass'
                },
                b: {
                    $ref: '/src/test-assets#AClass'
                },
                d: {
                    $ref: '/src/test-assets#typeof AClass'
                },
                default: {
                    $ref: '/src/test-assets#AClass'
                }
            },
            definitions: {},
            moduleDependencies: ['/src/test-assets']
        };

        expect(res).to.eql(expected);
    });

    it('should support node modules import', async () => {
        const moduleId = 'imports';
        const res = await transformTest(
            `
        import * as stuff  from 'third-party';

        export let a:stuff.AClass;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                a: {
                    $ref: 'third-party#AClass'
                }
            },
            definitions: {},
            moduleDependencies: ['third-party']
        };

        expect(res).to.eql(expected);
    });

    it('should support import export', async () => {
        const moduleId = 'imports';
        const res = await transformTest(
            `
        export {AType} from './test-assets';
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                AType: {
                    $ref: '/src/test-assets#typeof AType'
                }
            },
            definitions: {},
            moduleDependencies: ['/src/test-assets']
        };

        expect(res).to.eql(expected);
    });
});
