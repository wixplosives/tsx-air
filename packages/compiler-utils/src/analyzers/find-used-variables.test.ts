import { UsedVariables } from './types';
// tslint:disable: no-unused-expression
import { parseValue, asSourceFile } from '../ast-utils/parser';
import { expect } from 'chai';
import { findUsedVariables } from './find-used-variables';
import '../dev-utils/global-dev-tools';
import ts from 'typescript';
import { scan } from '../ast-utils/scanner';

describe('findUsedVariables', () => {
    it('should find defined variables', () => {
        const ast = parseValue(`(aParam)=>{
                const a = 'a';
                /* with leading comment */
                let b = 'b';
                var c = 'c';
            }`);

        expect(findUsedVariables(ast).defined).to.eql({
            aParam: {},
            a: {},
            b: {},
            c: {}
        });
    });

    it('should find accessed members', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam.internalObj.property
                /* with leading comment */
                const b = aParam.internalObj.anotherProperty
                const c = { val: aParam.field }
            }`);

        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                field: {},
                internalObj: {
                    property: {},
                    anotherProperty: {}
                }
            }
        });
        expect(findUsedVariables(ast).read).to.eql(findUsedVariables(ast).accessed);
    });

    it('should find modified members', () => {
        const ast = parseValue(`(aParam)=>{
                aParam.replacedProperty = aParam.internalObject.accessedProperty;
                /* with leading comment */
                aParam.addedToProperty += 'a';
                aParam.removedFromProperty -= 3;
                aParam.devidedProperty /= 3;
                aParam.multipliedProperty *= 3;
                aParam.increasedProperty++;
                ++aParam.increasedPropertyPre;
                aParam.decreasedProperty--;
                --aParam.decreasedPropertyPre;
            }`);
        const expectedModified = {
            aParam: {
                replacedProperty: {},
                addedToProperty: {},
                removedFromProperty: {},
                devidedProperty: {},
                multipliedProperty: {},
                increasedProperty: {},
                increasedPropertyPre: {},
                decreasedProperty: {},
                decreasedPropertyPre: {}
            }
        };
        expect(findUsedVariables(ast).modified).to.eql(expectedModified);
        expect(findUsedVariables(ast).accessed, 'modified members should also be considered as accessed').to.eql({
            aParam: {
                internalObject: {
                    accessedProperty: {}
                },
                ...expectedModified.aParam
            }
        });
        expect(findUsedVariables(ast).read).to.eql({
            aParam: {
                internalObject: {
                    accessedProperty: {}
                }
            }
        });
    });
    it('should ignore keys of assigned literals', () => {
        const ast = asSourceFile(`
            export const anObject = {
                title: 'a'
            }
            `);
        const expected: UsedVariables = {
            read: {},
            accessed: {},
            defined: {
                anObject: {}
            },
            modified: {}
        };
        expect(findUsedVariables(ast), 'Should not include "title"').to.eql(expected);
    });
    it('should find vars in jsx', () => {
        const ast = asSourceFile(`
            export const aJSXRoot () => <div onClick={onClickHandler}/>
            `);
        const expected: UsedVariables = {
            read: {
                onClickHandler: {}
            },
            accessed: {
                onClickHandler: {}
            },
            defined: {
                aJSXRoot: {}
            },
            modified: {}
        };
        expect(findUsedVariables(ast), 'Should find the click handler').to.eql(expected);
    });
    it('should ignore reference to html elements and components', () => {
        const ast = asSourceFile(`
            export const aJSXRoot = <div><Comp>hello<Comp></div>
            `);
        const expected: UsedVariables = {
            read: {},
            accessed: {},
            defined: {
                aJSXRoot: {}
            },
            modified: {}
        };
        expect(findUsedVariables(ast), 'Should not include "Comp" and "div" in accessed').to.eql(expected);
    });
    it('should ignore typescript types', () => {
        const ast = asSourceFile(`
            interface AnInterface{
                title: string;
            }
            type a = 'a' | AnInterface;
            export const b: AnInterface = {
                title: 'a'
            }
            `);
        const expected: UsedVariables = {
            read: {},
            accessed: {},
            defined: {
                b: {}
            },
            modified: {}
        };
        expect(findUsedVariables(ast), 'Should not include "AnInterface"').to.eql(expected);
    });
    it('should mark method calls as access', () => {
        const ast = parseValue(`(aParam)=>{
                aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty);
                aParam.internalObject.methodProperty.name;
            }
            `);

        expect(
            findUsedVariables(ast).accessed.aParam.internalObject.methodProperty,
            'methods calls are considered as access'
        ).not.to.be.undefined;
        expect(
            findUsedVariables(ast).accessed.aParam.internalObject.accessedProperty,
            'access in call arguments is found'
        ).not.to.be.undefined;
        expect(
            findUsedVariables(ast).accessed.aParam.internalObject.methodProperty.name,
            'methods can also have fields'
        ).not.to.be.undefined;
        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                internalObject: {
                    accessedProperty: {},
                    methodProperty: {
                        name: {}
                    }
                }
            }
        });
    });
    it('should mark reference by literal strings as access', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam['object-with-kebab-case'].internalProperty;
                const b = aParam.internalObject['property-with-kebab-case'];
            }`);

        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                ['object-with-kebab-case']: {
                    internalProperty: {}
                },
                internalObject: {
                    ['property-with-kebab-case']: {}
                }
            }
        });
    });
    it('should mark reference by parameters as 2 separate access', () => {
        const ast = parseValue(`(aParam)=>{
                // 'shouldBeIgnored' is ignored because it comes after a dynamic path access 
                const a = aParam.internalObject[aParam.aKey].shouldBeIgnored;
            }`);
        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                internalObject: {},
                aKey: {}
            }
        });
    });
    it('should accept filter function to allow ignoring nodes', () => {
        const ast = parseValue(`( externalMethodsParam )=>{
                const definedInOuterScope = ( internalMethodParam )=>{
                    const definedInInnerScope = externalMethodsParam.aProp;
                };
            }`);

        expect(findUsedVariables(ast, ts.isArrowFunction)).to.eql({
            read: {},
            accessed: {},
            defined: {
                externalMethodsParam: {},
                definedInOuterScope: {}
            },
            modified: {}
        });

        expect(findUsedVariables(ast)).to.eql({
            read: {
                externalMethodsParam: {
                    aProp: {}
                }
            },
            accessed: {
                externalMethodsParam: {
                    aProp: {}
                }
            },
            defined: {
                externalMethodsParam: {},
                definedInOuterScope: {},
                internalMethodParam: {},
                definedInInnerScope: {}
            },
            modified: {}
        });
    });
    it(`finds string template variables`, () => {
        const ast = parseValue('() => `<div dir="${"ltr"}" lang="${props.a}"><span></span></div>`');
        const template = scan(ast, ts.isTemplateExpression)[0].node;
        const used = findUsedVariables(template);

        expect(used).to.eql({
            read: {
                props: { a: {} }
            },
            accessed: {
                props: { a: {} }
            },
            defined: {},
            modified: {}
        });
    });
});
