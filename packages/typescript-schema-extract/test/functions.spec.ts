import { expect } from 'chai';
import { IModuleSchema, UndefinedSchemaId, FunctionSchemaId, ModuleSchemaId } from '../src/json-schema-types';
import { transformTest } from '../test-kit/run-transform';

describe('schema-extract - functions', () => {
    it('should support infered function return values', async () => {
        const moduleId = 'infered_functions';
        const res = await transformTest(
            `
        export function inferedFunction(str:string){
            return str+'a'
        };

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                inferedFunction: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        type: 'string'
                    }
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
    it('should support declared functions return values', async () => {
        const moduleId = 'functions';
        const functionInitializer = `(str:string)=>{
            return str+'a'
        }`;
        const res = await transformTest(
            `

        export const declaredFunction:(str:string)=>string = ${functionInitializer};


        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                declaredFunction: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        type: 'string'
                    },
                    initializer: functionInitializer
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support declared functions with optional params', async () => {
        const moduleId = 'functions';

        const functionInitializer = `(str:string)=>{
            return str+'a'
        }`;
        const res = await transformTest(
            `

        export const declaredFunction:(str:string,num?:number)=>string = ${functionInitializer};


        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                declaredFunction: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        },
                        {
                            type: 'number',
                            name: 'num'
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        type: 'string'
                    },
                    initializer: functionInitializer
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
    it('should support declared functions with optional params (default value)', async () => {
        const moduleId = 'functions';
        const functionInitializer = `(str:string)=>{
            return str+'a'
        }`;
        const res = await transformTest(
            `

        export const declaredFunction:(str:string,num:number = 5)=>string = ${functionInitializer};


        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                declaredFunction: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        },
                        {
                            type: 'number',
                            name: 'num',
                            default: 5
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        type: 'string'
                    },
                    initializer: functionInitializer
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support functions with parameter deconstruct', async () => {
        const moduleId = 'functions';
        const res = await transformTest(
            `

        export function inferedDeconstruct ({x=1, y="text"}) { return x + y; };


        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                inferedDeconstruct: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            name: '{x=1, y="text"}',
                            type: 'object',
                            properties: {
                                x: {
                                    type: 'number'
                                },
                                y: {
                                    type: 'string'
                                }
                            },
                            default: {
                                x: 1,
                                y: 'text'
                            }
                        }
                    ],
                    requiredArguments: [],
                    returns: {
                        type: 'string'
                    }
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
    it('should support functions with rest params', async () => {
        const moduleId = 'functions';
        const functionInitializer = `(str:string)=>{
            return str+'a'
        }`;
        const res = await transformTest(
            `
        export const functionWithRestParams:(str:string, ...rest:number[])=>string = ${functionInitializer};

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                functionWithRestParams: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        }
                    ],
                    requiredArguments: ['str'],

                    restArgument: {
                        name: 'rest',
                        type: 'array',
                        items: {
                            type: 'number'
                        }
                    },
                    returns: {
                        type: 'string'
                    },
                    initializer: functionInitializer
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support infered void functions', async () => {
        const moduleId = 'functions';
        const res = await transformTest(
            `
        export function voidFunc(str:string){
            console.log(str);
        };

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: ModuleSchemaId,
            properties: {
                voidFunc: {
                    $ref: FunctionSchemaId,
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        $ref: UndefinedSchemaId
                    }
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support declared void functions', async () => {
        const moduleId = 'functions';
        const res = await transformTest(
            `
        export function voidFunc(str:string):void{
            console.log(str);
        };

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: ModuleSchemaId,
            properties: {
                voidFunc: {
                    $ref: FunctionSchemaId,
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        $ref: UndefinedSchemaId
                    }
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support arrow functions', async () => {
        const moduleId = 'functions';
        const res = await transformTest(
            `
        export const add = (x:number, y:number) => x+y;
        `,
            moduleId
        );
        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: ModuleSchemaId,
            properties: {
                add: {
                    $ref: FunctionSchemaId,
                    arguments: [
                        {
                            type: 'number',
                            name: 'x'
                        },
                        {
                            type: 'number',
                            name: 'y'
                        }
                    ],
                    requiredArguments: ['x', 'y'],
                    returns: {
                        type: 'number'
                    },
                    initializer: '(x:number, y:number) => x+y'
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });

    it('should support infered function return type (non primitive import)', async () => {
        const moduleId = 'infered_functions';
        const res = await transformTest(
            `
        import {AClass} from './test-assets
        export function inferedFunction(str:string){
            const res:AClass = 'gaga' as any;
            return res;
        };

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                inferedFunction: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            type: 'string',
                            name: 'str'
                        }
                    ],
                    requiredArguments: ['str'],
                    returns: {
                        $ref: '/src/test-assets#AClass'
                    }
                }
            },
            definitions: {},
            moduleDependencies: ['/src/test-assets']
        };
        expect(res).to.eql(expected);
    });

    it('should support functions that return JSX element', async () => {
        const moduleId = 'jsx_functions';
        const res = await transformTest(
            `
        import React from 'react';

        export function jsxFunction(){
            return <p>Hello!</p>;
        };

        `,
            moduleId,
            'tested-module.tsx'
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                jsxFunction: {
                    $ref: 'common/function',
                    arguments: [],
                    requiredArguments: [],
                    returns: {
                        $ref: '/node_modules/@types/react/index.d#JSX.Element'
                    }
                }
            },
            definitions: {},
            moduleDependencies: ['/node_modules/@types/react/index.d']
        };
        expect(res).to.eql(expected);
    });

    it('should support function arguments with implicit any', async () => {
        const moduleId = 'infered_functions';
        const res = await transformTest(
            `
        export function myFunc(x){
        };

        `,
            moduleId
        );

        const expected: IModuleSchema = {
            $id: '/src/' + moduleId,
            $ref: 'common/module',
            properties: {
                myFunc: {
                    $ref: 'common/function',
                    arguments: [
                        {
                            name: 'x'
                        }
                    ],
                    requiredArguments: ['x'],
                    returns: {
                        $ref: UndefinedSchemaId
                    }
                }
            },
            definitions: {},
            moduleDependencies: []
        };
        expect(res).to.eql(expected);
    });
});
