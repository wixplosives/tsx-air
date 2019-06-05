import { expect } from 'chai';
import { ICodeSchema, ClassSchemaId } from '../../src/json-schema-types';
import { linkTest } from '../../test-kit/run-linker';

describe('schema-linker - generic types', () => {
    it('should flatten generic type definition', async () => {
        const fileName = 'index.ts';
        const res = await linkTest(
            {
                [fileName]: `
        export type MyType<T, W> = {
            something:W;
            someone: T;
        };
        export type B = MyType<string, number>;
        `
            },
            'B',
            fileName
        );

        const expected: ICodeSchema = {
            type: 'object',
            definedAt: '#MyType',
            properties: {
                something: {
                    type: 'number'
                },
                someone: {
                    type: 'string'
                }
            },
            required: ['something', 'someone']
        };
        expect(res).to.eql(expected);
    });

    it('should deep flatten generic type definition', async () => {
        const fileName = 'index.ts';
        const res = await linkTest(
            {
                [fileName]: `
        export type MyType<T> = {
            something: {
                a: T;
            };
        };
        export type B = MyType<string>;
        `
            },
            'B',
            fileName
        );

        const expected: ICodeSchema = {
            type: 'object',
            definedAt: '#MyType',
            properties: {
                something: {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string'
                        }
                    },
                    required: ['a']
                }
            },
            required: ['something']
        };
        expect(res).to.eql(expected);
    });

    it('should deep flatten generic type definition 3 levels', async () => {
        const fileName = 'index.ts';
        const res = await linkTest(
            {
                [fileName]: `

        export type MyTypeA<T, Y> = {
            something: {
                a: T;
                b: Y;
            };
        };
        export type MyTypeB<T> = MyTypeA<T, string>;
        export type B = MyTypeB<number>;
        `
            },
            'B',
            fileName
        );

        const expected: ICodeSchema = {
            type: 'object',
            definedAt: '#MyTypeA',
            properties: {
                something: {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'number'
                        },
                        b: {
                            type: 'string'
                        }
                    },
                    required: ['a', 'b']
                }
            },
            required: ['something']
        };
        expect(res).to.eql(expected);
    });
    it('should deep flatten generic type definition with arrays', async () => {
        const fileName = 'index.ts';
        const res = await linkTest(
            {
                [fileName]: `
        export type MyType<T> = {
            something: {
                a: T[];
            };
        };
        export type B = MyType<string>;
        `
            },
            'B',
            fileName
        );

        const expected: ICodeSchema = {
            type: 'object',
            definedAt: '#MyType',
            properties: {
                something: {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['a']
                }
            },
            required: ['something']
        };
        expect(res).to.eql(expected);
    });
    it('should deep flatten generic class definition', async () => {
        const fileName = 'index.ts';
        const res = await linkTest(
            {
                [fileName]: `
        export class A<T>{
            b: {b: T}
        };

        export class B extends A<string>{};
        `
            },
            'B',
            fileName
        );

        const expected = {
            $ref: ClassSchemaId,
            extends: {
                $ref: '#A'
            },
            staticProperties: {},
            properties: {
                b: {
                    type: 'object',
                    inheritedFrom: '#A',
                    properties: {
                        b: { type: 'string' }
                    },
                    required: ['b']
                }
            }
        };
        expect(res).to.eql(expected);
    });
});
