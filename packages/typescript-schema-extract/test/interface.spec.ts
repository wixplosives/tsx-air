import { expect } from 'chai';
import { IModuleSchema, InterfaceSchemaId } from '../src/json-schema-types';
import { transformTest } from '../test-kit/run-transform';

describe('schema-extract - interfaces', () => {
    it('should support typed interfaces', async () => {
        const moduleId = 'arrays';
        const res = await transformTest(
            `
        import { AType } from './test-assets';

        export interface MyInterface{
            title:string;
        };
        export let param:MyInterface;
        export interface Extendz extends MyInterface {
            desc: string;
        }
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                MyInterface: {
                    $ref: InterfaceSchemaId,
                    properties: {
                        title: {
                            type: 'string'
                        }
                    },
                    required: ['title']
                },
                Extendz: {
                    $ref: InterfaceSchemaId,
                    extends: [
                        {
                            $ref: '#MyInterface'
                        }
                    ],
                    properties: {
                        desc: {
                            type: 'string'
                        }
                    },
                    required: ['desc']
                }
            },
            properties: {
                param: {
                    $ref: '#MyInterface'
                }
            },
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
    it('should support recursive interfaces', async () => {
        const moduleId = 'arrays';
        const res = await transformTest(
            `
        import { AType } from './test-assets';

        export interface MyInterface{
            a:MyInterface2;
        };

        export interface MyInterface2{
            b:MyInterface;
        };
        export let param:MyInterface;
        export let param2:MyInterface2;

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                MyInterface: {
                    $ref: InterfaceSchemaId,
                    properties: {
                        a: {
                            $ref: '#MyInterface2'
                        }
                    },
                    required: ['a']
                },
                MyInterface2: {
                    $ref: InterfaceSchemaId,
                    properties: {
                        b: {
                            $ref: '#MyInterface'
                        }
                    },
                    required: ['b']
                }
            },
            properties: {
                param: {
                    $ref: '#MyInterface'
                },
                param2: {
                    $ref: '#MyInterface2'
                }
            },
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
});
