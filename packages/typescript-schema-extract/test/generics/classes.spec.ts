import { expect } from 'chai';
import {
    IModuleSchema,
    ModuleSchemaId,
    ClassSchemaId,
    FunctionSchemaId,
    UndefinedSchemaId,
    ClassConstructorSchemaId
} from '../../src/json-schema-types';
import { transformTest } from '../../test-kit/run-transform';

describe('schema-extract - generic classes', () => {
    it('should support generic classes', async () => {
        const moduleId = 'classes';
        const res = await transformTest(
            `
        import { AGenericClass} from './test-assets'

        export class MyClass<P, T> extends AGenericClass<P>{
            a:P;
            b:T;
            constructor(x:T, y:P){
                super();
            }
            setA(newA:T,prefix?:P):void{

            }
        };
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: ModuleSchemaId,
            definitions: {
                MyClass: {
                    $ref: ClassSchemaId,
                    constructor: {
                        $ref: ClassConstructorSchemaId,
                        arguments: [
                            {
                                $ref: '#MyClass!T',
                                name: 'x'
                            },
                            {
                                $ref: '#MyClass!P',
                                name: 'y'
                            }
                        ],
                        requiredArguments: ['x', 'y']
                    },
                    genericParams: [
                        {
                            name: 'P'
                        },
                        {
                            name: 'T'
                        }
                    ],
                    extends: {
                        $ref: '/src/test-assets#AGenericClass',
                        genericArguments: [
                            {
                                $ref: '#MyClass!P'
                            }
                        ]
                    },
                    properties: {
                        a: {
                            $ref: '#MyClass!P'
                        },
                        b: {
                            $ref: '#MyClass!T'
                        },
                        setA: {
                            $ref: FunctionSchemaId,
                            arguments: [{ $ref: '#MyClass!T', name: 'newA' }, { $ref: '#MyClass!P', name: 'prefix' }],
                            requiredArguments: ['newA'],
                            returns: {
                                $ref: UndefinedSchemaId
                            }
                        }
                    },
                    staticProperties: {}
                }
            },
            properties: {
                MyClass: {
                    $ref: '#typeof MyClass'
                }
            },
            moduleDependencies: ['/src/test-assets']
        };
        expect(res).to.eql(expected);
    });

    // Need a better description
    xit('should support classes with generic handlers', async () => {
        const moduleId = 'classes';
        const res = await transformTest(
            `
        import { Event} from './test-assets'

        export class MyClass{
            constructor(){
                super();
            }
            handleEvent = (e: Event<HTMLElement) => {

            }
        };
        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: ModuleSchemaId,
            definitions: {
                MyClass: {
                    $ref: ClassSchemaId,
                    constructor: {
                        $ref: ClassConstructorSchemaId,
                        arguments: []
                    },
                    properties: {
                        handleEvent: {
                            $ref: FunctionSchemaId,
                            arguments: [{ $ref: 'Event#HTMLElement', name: 'event' }],
                            returns: {
                                $ref: UndefinedSchemaId
                            }
                        }
                    },
                    staticProperties: {}
                }
            },
            properties: {
                MyClass: {
                    $ref: '#typeof MyClass'
                }
            },
            moduleDependencies: ['/src/test-assets']
        };
        expect(res).to.eql(expected);
    });
});
