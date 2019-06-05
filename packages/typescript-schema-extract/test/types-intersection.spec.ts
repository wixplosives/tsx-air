import { expect } from 'chai';
import { IModuleSchema } from '../src/json-schema-types';
import { transformTest } from '../test-kit/run-transform';

describe('schema-extract - intersection', () => {
    it('should support intersection types', async () => {
        const moduleId = 'intersection';
        const res = await transformTest(
            `
        export type A = {
            a:string;
            b:string;
            c:string;
        }
        export type RGB = {
            r:string;
            g:string;
            b:string;
        }

        export type Intersection = A & RGB;
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            definitions: {
                A: {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string'
                        },
                        b: {
                            type: 'string'
                        },
                        c: {
                            type: 'string'
                        }
                    },
                    required: ['a', 'b', 'c']
                },
                RGB: {
                    type: 'object',
                    properties: {
                        r: {
                            type: 'string'
                        },
                        g: {
                            type: 'string'
                        },
                        b: {
                            type: 'string'
                        }
                    },
                    required: ['r', 'g', 'b']
                },
                Intersection: {
                    allOf: [
                        {
                            $ref: '#A'
                        },
                        {
                            $ref: '#RGB'
                        }
                    ]
                }
            },
            properties: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
});
