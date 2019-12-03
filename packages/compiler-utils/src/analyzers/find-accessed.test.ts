import { parseValue, asSourceFile } from '../astUtils/parser';
import { expect } from 'chai';
import { AccesedMembers } from './types';
import { findAccessedMembers } from './find-accessed';
import '../dev-utils/global-dev-tools';


describe('findAccessedMembers', () => {
    it('should find defined', () => {
        const ast = parseValue(`(aParam)=>{
                const a = 'a';
                const b = 'b';
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
            },
            defined: {
                aParam: {},
                a: {},
                b: {}
            },
            modified: {}
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should find accessed members', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam.internalObj.property
                const b = aParam.internalObj.anotherProperty
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
                aParam: {
                    internalObj: {
                        property: {},
                        anotherProperty: {}
                    }
                }
            },
            defined: {
                aParam: {},
                a: {},
                b: {}
            },
            modified: {}
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should find modifed members', () => {
        const ast = parseValue(`(aParam)=>{
                aParam.internalObject.modifiedProperty = aParam.internalObject.accessedProperty;
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
                aParam: {
                    internalObject: {
                        accessedProperty: {},
                        modifiedProperty: {}
                    }
                }
            },
            defined: {
                aParam: {},
            },
            modified: {
                aParam: {
                    internalObject: {
                        modifiedProperty: {}
                    }
                }
            }
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should ignore types', () => {
        const ast = asSourceFile(`
            interface AnInterface{
                title: string;
            }
            type a = 'a' | AnInterface;
            export const b: AnInterface = {
                title: window.location
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
                window: {
                    location: {}
                }
            },
            defined: {
                b: {}
            },
            modified: {
            }
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should mark calls as access', () => {
        const ast = parseValue(`(aParam)=>{
                aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty);
                aParam.internalObject.methodProperty.name;
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
                aParam: {
                    internalObject: {
                        accessedProperty: {},
                        methodProperty: {
                            name: {}
                        }
                    }
                }
            },
            defined: {
                aParam: {},
            },
            modified: {

            }
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should mark reference by literal strings as access', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam['object-with-kebab-case'].internalProperty;
                const b = aParam.internalObject['property-with-kebab-case'];
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
                aParam: {
                    ['object-with-kebab-case']: {
                        internalProperty: {}
                    },
                    internalObject: {
                        ['property-with-kebab-case']: {}
                    }
                }
            },
            defined: {
                aParam: {},
                a: {},
                b: {}
            },
            modified: {

            }
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should mark reference by parameters as 2 separate access', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam.internalObject[aParam.aKey].shouldBeIgnored;
            }
            `);
        const expected: AccesedMembers = {
            accessed: {
                aParam: {
                    internalObject: {
                    },
                    aKey: {
                    }
                }
            },
            defined: {
                aParam: {},
                a: {},
            },
            modified: {

            }
        };
        expect(findAccessedMembers(ast)).to.eql(expected);
    });
    it('should ignore internal functions unless flagged as deep', () => {
        const ast = parseValue(`(aParam)=>{
                const a = ()=>{
                    const b = aParam.internalProperty;
                };
                const c = function(){
                    const d = aParam.internalProperty
                }
            }
            `);
        const expected1: AccesedMembers = {
            accessed: {
            },
            defined: {
                aParam: {},
                a: {},
                c: {}
            },
            modified: {
            }
        };
        const expected2: AccesedMembers = {
            accessed: {
                aParam: {
                    internalProperty: {}
                }
            },
            defined: {
                aParam: {},
                a: {},
                b: {},
                c: {},
                d: {}
            },
            modified: {
            }
        };
        expect(findAccessedMembers(ast)).to.eql(expected1);
        expect(findAccessedMembers(ast, true)).to.eql(expected2);
    });
});
