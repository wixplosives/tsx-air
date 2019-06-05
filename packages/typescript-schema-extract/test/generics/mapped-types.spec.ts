import { expect } from 'chai';
import { IModuleSchema } from '../../src/json-schema-types';
import { transformTest } from '../../test-kit/run-transform';

describe('schema-extract - generic mapped types', () => {
    it('should support genric mapped type definition', async () => {
        const moduleId = 'type-definition';
        const res = await transformTest(
            `
        export type MyType<T> = {
            [something in 'a' | 'b']:T;
        };
        export let param:MyType<string>;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                MyType: {
                    type: 'object',
                    properties: {},
                    genericParams: [
                        {
                            name: 'T'
                        }
                    ],
                    additionalProperties: {
                        $ref: '#MyType!T'
                    },
                    propertyNames: {
                        type: 'string',
                        enum: ['a', 'b']
                    },
                    required: []
                }
            },
            properties: {
                param: {
                    $ref: '#MyType',
                    genericArguments: [
                        {
                            type: 'string'
                        }
                    ]
                }
            },
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support generic key for mapped types', async () => {
        const moduleId = 'type-definition';
        const res = await transformTest(
            `
        export type MyType<T extends string> = {
            [key in T]:string;
        };
        export let param:MyType<'gaga'>;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                MyType: {
                    type: 'object',
                    properties: {},
                    genericParams: [
                        {
                            name: 'T',
                            type: 'string'
                        }
                    ],
                    additionalProperties: {
                        type: 'string'
                    },
                    propertyNames: {
                        $ref: '#MyType!T'
                    },
                    required: []
                }
            },
            properties: {
                param: {
                    $ref: '#MyType',
                    genericArguments: [
                        {
                            type: 'string',
                            enum: ['gaga']
                        }
                    ]
                }
            },
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
});
