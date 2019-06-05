import { expect } from 'chai';
import { IModuleSchema } from '../src/json-schema-types';
import { transformTest } from '../test-kit/run-transform';

describe('schema-extract - arrays', () => {
    it('should support types arrays', async () => {
        const moduleId = 'arrays';
        const res = await transformTest(
            `
        import { AType } from './test-assets';

        export let declared_array:string[];
        export let import_array:Array<AType>;

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                declared_array: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                import_array: {
                    type: 'array',
                    items: {
                        $ref: '/src/test-assets#AType'
                    }
                }
            },
            definitions: {},
            moduleDependencies: ['/src/test-assets']
        };
        expect(res).to.eql(expected);
    }); it('should support tupple types', async () => {
        const moduleId = 'arrays';
        const res = await transformTest(
            `
        import { AType } from './test-assets';

        export let declared_array:[string, number, AType];

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                declared_array: {
                    type: 'array',
                    items: [{
                        type: 'string'
                    },{
                        type: 'number'
                    },{
                        $ref: '/src/test-assets#AType'
                    }]
                }
            },
            definitions: {},
            moduleDependencies: ['/src/test-assets']
        };
        expect(res).to.eql(expected);
    });
});
