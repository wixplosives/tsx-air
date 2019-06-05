import { expect } from 'chai';
import { IModuleSchema, FunctionSchemaId } from '../../src/json-schema-types';
import { transformTest } from '../../test-kit/run-transform';

describe('schema-extract - generic types', () => {
    it('should support genric type definition', async () => {
        const moduleId = 'type-definition';
        const res = await transformTest(
            `
        export type MyType<T> = {
            something:T;
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
                    genericParams: [
                        {
                            name: 'T'
                        }
                    ],
                    properties: {
                        something: {
                            $ref: '#MyType!T'
                        }
                    },
                    required: ['something']
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

    it('should support generic arguments schema', async () => {
        const moduleId = 'type-definition';
        const res = await transformTest(
            `
        export type MyType<T extends string> = {
            something:T;
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
                    genericParams: [
                        {
                            name: 'T',
                            type: 'string'
                        }
                    ],
                    properties: {
                        something: {
                            $ref: '#MyType!T'
                        }
                    },
                    required: ['something']
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

    it('generic arguments should be passed deeply', async () => {
        const moduleId = 'type-definition';
        const res = await transformTest(
            `
        export type MyType<T extends string> = {
            something:{
                deepKey:T
            };
            method:(arg:{
                values:T[],
                filter:(item:T)=>boolean
            })=>{
                status:string,
                results:T[]
            }
        };
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                MyType: {
                    type: 'object',
                    genericParams: [
                        {
                            name: 'T',
                            type: 'string'
                        }
                    ],
                    properties: {
                        something: {
                            type: 'object',
                            properties: {
                                deepKey: {
                                    $ref: '#MyType!T'
                                }
                            },
                            required: ['deepKey']
                        },
                        method: {
                            $ref: FunctionSchemaId,
                            arguments: [
                                {
                                    name: 'arg',
                                    type: 'object',
                                    properties: {
                                        values: {
                                            type: 'array',
                                            items: {
                                                $ref: '#MyType!T'
                                            }
                                        },

                                        filter: {
                                            $ref: FunctionSchemaId,
                                            arguments: [
                                                {
                                                    name: 'item',
                                                    $ref: '#MyType!T'
                                                }
                                            ],
                                            requiredArguments: ['item'],

                                            returns: {
                                                type: 'boolean'
                                            }
                                        }
                                    },
                                    required: ['values', 'filter']
                                }
                            ],
                            requiredArguments: ['arg'],
                            returns: {
                                type: 'object',
                                properties: {
                                    status: {
                                        type: 'string'
                                    },
                                    results: {
                                        type: 'array',
                                        items: {
                                            $ref: '#MyType!T'
                                        }
                                    }
                                },
                                required: ['status', 'results']
                            }
                        }
                    },
                    required: ['something', 'method']
                }
            },
            properties: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
});
