import { expect } from 'chai';
import { IModuleSchema } from '../src/json-schema-types';
import { transformTest } from '../test-kit/run-transform';

describe('schema-extract - type declarations', () => {
    it('should support type definition', async () => {
        const moduleId = 'type-definition';
        const res = await transformTest(
            `
        import { AType } from './test-assets';

        export type MyType = {
            title:string;
            imported:AType;
        };
        export let param:MyType;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                MyType: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string'
                        },
                        imported: {
                            $ref: '/src/test-assets#AType'
                        }
                    },
                    required: ['title', 'imported']
                }
            },
            properties: {
                param: {
                    $ref: '#MyType'
                }
            },
            moduleDependencies: ['/src/test-assets']
        };
        expect(res).to.eql(expected);
    });
    it('should support type alias', async () => {
        const moduleId = 'type-alias';
        const res = await transformTest(
            `
        export type alias = string;
        export let param:alias;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                alias: {
                    type: 'string'
                }
            },
            properties: {
                param: {
                    $ref: '#alias'
                }
            },
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support recursive types', async () => {
        const moduleId = 'type-recurse';
        const res = await transformTest(
            `
        export type recurse = {
            prop:recurse;
        };
        export let param:recurse;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                recurse: {
                    type: 'object',
                    properties: {
                        prop: {
                            $ref: '#recurse'
                        }
                    },
                    required: ['prop']
                }
            },
            properties: {
                param: {
                    $ref: '#recurse'
                }
            },
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support types with specific index signature ( mapped-types )', async () => {
        const moduleId = 'index-signatures';
        const res = await transformTest(
            `
        import { AType } from './test-assets';

        export type mappedType = {[key in 'a' | 'b']:string};

        export type keys = 'a' | 'b' | 'c'
        export type  mappedType2 = {[key in keys]:string};

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                keys: {
                    type: 'string',
                    enum: ['a', 'b', 'c']
                },
                mappedType: {
                    type: 'object',
                    properties: {},
                    additionalProperties: {
                        type: 'string'
                    },
                    propertyNames: {
                        type: 'string',
                        enum: ['a', 'b']
                    },
                    required: []
                },

                mappedType2: {
                    type: 'object',
                    properties: {},
                    additionalProperties: {
                        type: 'string'
                    },
                    propertyNames: {
                        $ref: '#keys'
                    },
                    required: []
                }
            },
            properties: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
});
